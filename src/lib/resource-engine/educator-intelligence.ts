import { MasterEducatorMatch, EducationalDomain } from './types';

export interface RawEducatorRecord {
  id: string;
  name: string;
  ch: string;
  cid?: string;
  url: string;
  handle?: string;
  site?: string;
  grp: string;
  tx?: string[];
  topics?: string;
  lvl?: string;
  aud?: string;
  fmt?: string;
  intents?: string[];
  exams?: string[];
  aff?: string;
  best?: string;
  reps?: string[];
  ver_status?: string;
}

interface RawDirectoryData {
  version?: string;
  date?: string;
  educators?: RawEducatorRecord[];
}

export class EducatorIntelligenceSystem {
  private static instance: EducatorIntelligenceSystem | null = null;
  private educators: RawEducatorRecord[] = [];
  private channelIdIndex = new Map<string, RawEducatorRecord>();
  private nameIndex = new Map<string, RawEducatorRecord>();
  private handleIndex = new Map<string, RawEducatorRecord>();

  private constructor() {
    this.loadDataset();
  }

  public static getInstance(): EducatorIntelligenceSystem {
    if (!EducatorIntelligenceSystem.instance) {
      EducatorIntelligenceSystem.instance = new EducatorIntelligenceSystem();
    }
    return EducatorIntelligenceSystem.instance;
  }

  private loadDataset() {
    try {
      // 1. Try direct require
      try {
        const rawJson = require('../../../data/master-youtube-educator-directory.json') as RawDirectoryData;
        if (Array.isArray(rawJson.educators)) {
          this.educators = rawJson.educators;
          this.buildIndexes();
          return;
        }
      } catch {}

      // 2. Server-side fs fallback
      if (typeof window === 'undefined') {
        const fs = eval('require')('fs');
        const path = eval('require')('path');
        const p = path.join(process.cwd(), 'data', 'master-youtube-educator-directory.json');
        if (fs.existsSync(p)) {
          const raw = fs.readFileSync(p, 'utf-8');
          const parsed = JSON.parse(raw) as RawDirectoryData;
          if (Array.isArray(parsed.educators)) {
            this.educators = parsed.educators;
            this.buildIndexes();
            return;
          }
        }
      }
    } catch (err) {
      console.warn('[EducatorIntelligence] Directory dataset load notice:', err);
    }
  }

  private buildIndexes() {
    for (const ed of this.educators) {
      if (ed.cid) {
        this.channelIdIndex.set(ed.cid.trim().toLowerCase(), ed);
      }
      if (ed.ch) {
        this.nameIndex.set(ed.ch.trim().toLowerCase(), ed);
      }
      if (ed.name) {
        this.nameIndex.set(ed.name.trim().toLowerCase(), ed);
      }
      if (ed.handle) {
        const cleanHandle = ed.handle.trim().replace(/^@/, '').toLowerCase();
        this.handleIndex.set(cleanHandle, ed);
      }
    }
  }

  public getAllEducators(): RawEducatorRecord[] {
    return [...this.educators];
  }

  public findByChannelId(channelId: string): MasterEducatorMatch | null {
    if (!channelId) return null;
    const ed = this.channelIdIndex.get(channelId.trim().toLowerCase());
    return ed ? this.mapToMatch(ed, 100, ['Exact Channel ID']) : null;
  }

  public findByNameOrHandle(nameOrHandle: string): MasterEducatorMatch | null {
    if (!nameOrHandle) return null;
    const clean = nameOrHandle.trim().replace(/^@/, '').toLowerCase();
    const ed = this.handleIndex.get(clean) || this.nameIndex.get(clean);
    return ed ? this.mapToMatch(ed, 95, ['Exact Name/Handle Match']) : null;
  }

  public matchEducatorsForObjective(
    topicOrObjective: string,
    domain?: string,
    limit: number = 5
  ): MasterEducatorMatch[] {
    if (!topicOrObjective || this.educators.length === 0) return [];

    const queryTokens = this.tokenize(topicOrObjective);
    const scored: Array<{ ed: RawEducatorRecord; score: number; matchedConcepts: string[] }> = [];

    for (const ed of this.educators) {
      let score = 0;
      const matchedConcepts: string[] = [];

      // Check taxonomy/concept overlaps
      if (Array.isArray(ed.tx)) {
        for (const concept of ed.tx) {
          const conceptTokens = this.tokenize(concept);
          const overlap = this.tokenOverlap(queryTokens, conceptTokens);
          if (overlap > 0) {
            score += overlap * 25;
            matchedConcepts.push(concept);
          }
        }
      }

      // Check topics free text
      if (ed.topics) {
        const topicTokens = this.tokenize(ed.topics);
        const overlap = this.tokenOverlap(queryTokens, topicTokens);
        if (overlap > 0) {
          score += overlap * 10;
        }
      }

      // Check group / domain alignment
      if (domain && ed.grp) {
        const domainClean = domain.toLowerCase().replace(/[^a-z]/g, '');
        const grpClean = ed.grp.toLowerCase().replace(/[^a-z]/g, '');
        if (domainClean.includes(grpClean) || grpClean.includes(domainClean)) {
          score += 15;
        }
      }

      // Channel name bonus if query mentions channel
      const nameTokens = this.tokenize(`${ed.name} ${ed.ch} ${ed.handle || ''}`);
      if (this.tokenOverlap(queryTokens, nameTokens) > 0) {
        score += 30;
        matchedConcepts.push(ed.ch);
      }

      if (score > 15) {
        scored.push({ ed, score, matchedConcepts: Array.from(new Set(matchedConcepts)) });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((s) => this.mapToMatch(s.ed, Math.min(100, s.score), s.matchedConcepts));
  }

  private mapToMatch(ed: RawEducatorRecord, matchScore: number, matchedConcepts: string[]): MasterEducatorMatch {
    let status: MasterEducatorMatch['verificationStatus'] = 'UNVERIFIED';
    if (ed.ver_status === 'CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED') {
      status = 'CHANNEL_VERIFIED_CONTENT_NOT_REVIEWED';
    } else if (ed.ver_status === 'V' || ed.cid) {
      status = 'VERIFIED';
    }

    return {
      educatorId: ed.id,
      name: ed.name,
      channelName: ed.ch,
      channelId: ed.cid,
      channelUrl: ed.url,
      officialWebsite: ed.site,
      subjects: Array.isArray(ed.tx) ? ed.tx : [ed.grp],
      verificationStatus: status,
      matchScore,
      matchedConcepts,
      teachingStyle: ed.fmt,
      bestUse: ed.best,
    };
  }

  private tokenize(text: string): Set<string> {
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'from', 'into', 'during', 'including',
      'course', 'lecture', 'video', 'tutorial', 'full', 'learn', 'beginner',
      'complete', 'guide', 'introduction', 'basics', 'basics of', 'how to'
    ]);
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));
    return new Set(words);
  }

  private tokenOverlap(setA: Set<string>, setB: Set<string>): number {
    let matches = 0;
    for (const item of setA) {
      if (setB.has(item)) matches++;
    }
    return matches;
  }
}

export const educatorIntelligence = EducatorIntelligenceSystem.getInstance();
