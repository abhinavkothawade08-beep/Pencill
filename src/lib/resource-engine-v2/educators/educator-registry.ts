import {
  MasterEducatorRecord,
  MasterEducatorSchema,
  DomainTaxonomyRecord,
  ExaminationBlueprintRecord,
  VerifiedLearningResourceRecord,
} from './types';
import {
  MASTER_EDUCATOR_DIRECTORY,
  DOMAIN_TAXONOMY,
  EXAMINATION_DIRECTORY,
  VERIFIED_LEARNING_RESOURCES,
} from './master-dataset';
import { ChannelVerifier } from './channel-verifier';

export interface ImportSummary {
  importedCount: number;
  duplicateCount: number;
  invalidCount: number;
  errors: string[];
}

export class EducatorRegistry {
  private educatorsById = new Map<string, MasterEducatorRecord>();
  private educatorsByChannelId = new Map<string, MasterEducatorRecord>();
  private educatorsByHandle = new Map<string, MasterEducatorRecord>();
  private educatorsByName = new Map<string, MasterEducatorRecord>();
  private educatorsByKey = new Map<string, MasterEducatorRecord>();
  private educatorsByDomain = new Map<string, Set<string>>();
  private educatorsBySubject = new Map<string, Set<string>>();
  private educatorsByExam = new Map<string, Set<string>>();
  private educatorsByLanguage = new Map<string, Set<string>>();

  private domainsById = new Map<string, DomainTaxonomyRecord>();
  private examinationsById = new Map<string, ExaminationBlueprintRecord>();
  private verifiedResourcesById = new Map<string, VerifiedLearningResourceRecord>();

  constructor(initialEducators?: MasterEducatorRecord[]) {
    // Load taxonomy and exams
    for (const d of DOMAIN_TAXONOMY) {
      this.domainsById.set(d.Domain_ID, d);
    }
    for (const ex of EXAMINATION_DIRECTORY) {
      this.examinationsById.set(ex.Exam_ID, ex);
    }
    for (const r of VERIFIED_LEARNING_RESOURCES) {
      this.verifiedResourcesById.set(r.Resource_ID, r);
    }

    // Load directory
    const source = initialEducators || MASTER_EDUCATOR_DIRECTORY;
    this.importRecords(source, { overwrite: true });
  }

  /**
   * Normalizes an educational subject or topic token into clean lower-case search forms.
   */
  static normalizeToken(tok: string): string {
    return tok
      .toLowerCase()
      .replace(/[\-_/\\():;,]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Splits and normalizes semicolon or comma-separated lists of subjects/exams.
   */
  static parseTokens(rawString?: string): string[] {
    if (!rawString) return [];
    return rawString
      .split(/[;,]/)
      .map((s) => EducatorRegistry.normalizeToken(s))
      .filter((s) => s.length > 0);
  }

  /**
   * Imports a list of educator records with validation, deduplication, and indexing.
   */
  importRecords(
    records: unknown[],
    options?: { overwrite?: boolean }
  ): ImportSummary {
    const summary: ImportSummary = {
      importedCount: 0,
      duplicateCount: 0,
      invalidCount: 0,
      errors: [],
    };

    for (const raw of records) {
      const parsed = MasterEducatorSchema.safeParse(raw);
      if (!parsed.success) {
        summary.invalidCount++;
        summary.errors.push(
          `Validation failed for record "${(raw as any)?.Educator_ID || 'unknown'}": ${parsed.error.message}`
        );
        continue;
      }

      const rec = parsed.data as MasterEducatorRecord;
      const existing = this.educatorsById.get(rec.Educator_ID);

      if (existing && !options?.overwrite) {
        summary.duplicateCount++;
        continue;
      }

      // Check conflicting channel IDs
      if (rec.YouTube_Channel_ID && rec.YouTube_Channel_ID.length > 0) {
        const existingForChannel = this.educatorsByChannelId.get(rec.YouTube_Channel_ID);
        if (existingForChannel && existingForChannel.Educator_ID !== rec.Educator_ID && !options?.overwrite) {
          summary.duplicateCount++;
          summary.errors.push(
            `Conflicting Channel ID "${rec.YouTube_Channel_ID}" already registered under "${existingForChannel.Educator_ID}". Record skipped.`
          );
          continue;
        }
      }

      // Add to main map
      this.educatorsById.set(rec.Educator_ID, rec);

      // Channel ID index (canonical PEN-ED- records take precedence over legacy EDU- records)
      if (rec.YouTube_Channel_ID && rec.YouTube_Channel_ID.trim().length > 0) {
        const cleanChId = rec.YouTube_Channel_ID.trim();
        const existingForChannel = this.educatorsByChannelId.get(cleanChId);
        if (!existingForChannel || (!existingForChannel.Educator_ID.startsWith('PEN-ED-') && rec.Educator_ID.startsWith('PEN-ED-'))) {
          this.educatorsByChannelId.set(cleanChId, rec);
        }
      }

      // Handle index (canonical PEN-ED- records take precedence)
      const handle = rec.Channel_Handle
        ? ChannelVerifier.extractHandle(rec.Channel_Handle)
        : ChannelVerifier.extractHandle(rec.Official_Channel_URL);
      if (handle) {
        const existingForHandle = this.educatorsByHandle.get(handle);
        if (!existingForHandle || (!existingForHandle.Educator_ID.startsWith('PEN-ED-') && rec.Educator_ID.startsWith('PEN-ED-'))) {
          this.educatorsByHandle.set(handle, rec);
        }
      }

      // Name & Channel Name index (canonical PEN-ED- records take precedence)
      if (rec.Educator_Name) {
        const normName = ChannelVerifier.normalizeChannelName(rec.Educator_Name);
        const existingName = this.educatorsByName.get(normName);
        if (!existingName || (!existingName.Educator_ID.startsWith('PEN-ED-') && rec.Educator_ID.startsWith('PEN-ED-'))) {
          this.educatorsByName.set(normName, rec);
        }
      }
      if (rec.YouTube_Channel_Name) {
        const normChName = ChannelVerifier.normalizeChannelName(rec.YouTube_Channel_Name);
        const existingChName = this.educatorsByName.get(normChName);
        if (!existingChName || (!existingChName.Educator_ID.startsWith('PEN-ED-') && rec.Educator_ID.startsWith('PEN-ED-'))) {
          this.educatorsByName.set(normChName, rec);
        }
      }

      // Key index
      if (rec.Key) {
        this.educatorsByKey.set(rec.Key.toLowerCase(), rec);
      }

      // Domain index
      const normDomain = EducatorRegistry.normalizeToken(rec.Primary_Domain);
      if (!this.educatorsByDomain.has(normDomain)) {
        this.educatorsByDomain.set(normDomain, new Set());
      }
      this.educatorsByDomain.get(normDomain)!.add(rec.Educator_ID);

      // Subjects index
      const subjs = EducatorRegistry.parseTokens(rec.Subjects);
      for (const s of subjs) {
        if (!this.educatorsBySubject.has(s)) {
          this.educatorsBySubject.set(s, new Set());
        }
        this.educatorsBySubject.get(s)!.add(rec.Educator_ID);
      }

      // Examinations index
      const exams = EducatorRegistry.parseTokens(rec.Relevant_Examinations);
      for (const ex of exams) {
        if (!this.educatorsByExam.has(ex)) {
          this.educatorsByExam.set(ex, new Set());
        }
        this.educatorsByExam.get(ex)!.add(rec.Educator_ID);
      }

      // Language index
      const langs = [
        ...EducatorRegistry.parseTokens(rec.Primary_Language),
        ...EducatorRegistry.parseTokens(rec.Additional_Languages),
      ];
      for (const lang of langs) {
        if (!this.educatorsByLanguage.has(lang)) {
          this.educatorsByLanguage.set(lang, new Set());
        }
        this.educatorsByLanguage.get(lang)!.add(rec.Educator_ID);
      }

      summary.importedCount++;
    }

    return summary;
  }

  /**
   * Retrieves an educator by their unique Educator_ID (e.g. 'EDU-001').
   */
  getById(id: string): MasterEducatorRecord | undefined {
    return this.educatorsById.get(id);
  }

  getEducatorById(id: string): MasterEducatorRecord | undefined {
    return this.educatorsById.get(id);
  }

  /**
   * Retrieves an educator by their YouTube Channel ID (e.g. 'UCYO_jab_esuFRV4b17AJtAw').
   */
  getByChannelId(channelId?: string): MasterEducatorRecord | undefined {
    if (!channelId) return undefined;
    return this.educatorsByChannelId.get(channelId.trim());
  }

  /**
   * Retrieves an educator by their official YouTube @handle or channel URL.
   */
  getByHandle(handleOrUrl?: string): MasterEducatorRecord | undefined {
    const handle = ChannelVerifier.extractHandle(handleOrUrl);
    if (!handle) return undefined;
    return this.educatorsByHandle.get(handle);
  }

  /**
   * Retrieves an educator by normalized channel or creator name.
   */
  getByName(name?: string): MasterEducatorRecord | undefined {
    if (!name) return undefined;
    const norm = ChannelVerifier.normalizeChannelName(name);
    return this.educatorsByName.get(norm);
  }

  /**
   * Retrieves an educator by their short directory key (e.g. '3b1b', 'karpathy').
   */
  getByKey(key?: string): MasterEducatorRecord | undefined {
    if (!key) return undefined;
    return this.educatorsByKey.get(key.toLowerCase());
  }

  /**
   * Returns all registered master educators.
   */
  getAll(options?: { dataset?: 'all' | 'pen' | 'legacy' }): MasterEducatorRecord[] {
    if (options?.dataset === 'pen') {
      return Array.from(this.educatorsById.values()).filter((e) => e.Educator_ID.startsWith('PEN-ED-'));
    }
    if (options?.dataset === 'legacy') {
      return Array.from(this.educatorsById.values()).filter((e) => e.Educator_ID.startsWith('EDU-'));
    }
    return Array.from(this.educatorsById.values());
  }

  /**
   * Returns the 96 Global Master YouTube Educator Directory records (PEN-ED-0001 to PEN-ED-0096).
   */
  getGlobalEducators(): MasterEducatorRecord[] {
    return this.getAll({ dataset: 'pen' });
  }

  /**
   * Returns legacy educator records (EDU-001 to EDU-060) for backwards compatibility.
   */
  getLegacyEducators(): MasterEducatorRecord[] {
    return this.getAll({ dataset: 'legacy' });
  }

  /**
   * Returns count of registered educators.
   */
  size(): number {
    return this.educatorsById.size;
  }

  /**
   * Finds educators that match a specific examination keyword (e.g. 'JEE', 'MHT-CET', 'GATE', 'UPSC').
   */
  findByExamination(exam: string): MasterEducatorRecord[] {
    const norm = EducatorRegistry.normalizeToken(exam);
    const matches = new Set<string>();

    for (const [key, idSet] of this.educatorsByExam.entries()) {
      if (key.includes(norm) || norm.includes(key)) {
        for (const id of idSet) matches.add(id);
      }
    }

    return Array.from(matches)
      .map((id) => this.educatorsById.get(id)!)
      .filter(Boolean);
  }

  /**
   * Finds educators that match a specific subject (e.g. 'Mathematics', 'Python', 'Physics').
   */
  findBySubject(subject: string): MasterEducatorRecord[] {
    const norm = EducatorRegistry.normalizeToken(subject);
    const matches = new Set<string>();

    for (const [key, idSet] of this.educatorsBySubject.entries()) {
      if (key.includes(norm) || norm.includes(key)) {
        for (const id of idSet) matches.add(id);
      }
    }

    return Array.from(matches)
      .map((id) => this.educatorsById.get(id)!)
      .filter(Boolean);
  }

  /**
   * Finds educators belonging to a primary educational domain.
   */
  findByDomain(domain: string): MasterEducatorRecord[] {
    const norm = EducatorRegistry.normalizeToken(domain);
    const matches = new Set<string>();

    for (const [key, idSet] of this.educatorsByDomain.entries()) {
      if (key.includes(norm) || norm.includes(key)) {
        for (const id of idSet) matches.add(id);
      }
    }

    return Array.from(matches)
      .map((id) => this.educatorsById.get(id)!)
      .filter(Boolean);
  }

  /**
   * Retrieves verified flagship learning resources (RES-001 to RES-012).
   */
  getVerifiedLearningResources(filter?: { subject?: string; domain?: string }): VerifiedLearningResourceRecord[] {
    const all = Array.from(this.verifiedResourcesById.values());
    if (!filter) return all;

    return all.filter((r) => {
      if (filter.subject && !r.Subject.toLowerCase().includes(filter.subject.toLowerCase())) {
        return false;
      }
      if (filter.domain && !r.Primary_Domain.toLowerCase().includes(filter.domain.toLowerCase())) {
        return false;
      }
      return true;
    });
  }

  /**
   * Retrieves all examination blueprints (EXM-001 to EXM-025).
   */
  getAllExaminations(): ExaminationBlueprintRecord[] {
    return Array.from(this.examinationsById.values());
  }

  /**
   * Retrieves all domain taxonomies.
   */
  getAllDomains(): DomainTaxonomyRecord[] {
    return Array.from(this.domainsById.values());
  }
}

// Global Singleton Registry instance
export const educatorRegistry = new EducatorRegistry();
