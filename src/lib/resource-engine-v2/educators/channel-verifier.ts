import { MasterEducatorRecord, ChannelIdentityVerification } from './types';

export class ChannelVerifier {
  /**
   * Extracts a YouTube handle (e.g. '@MyDineshSir') from a channel URL or string.
   */
  static extractHandle(urlOrHandle?: string): string | null {
    if (!urlOrHandle) return null;
    const str = urlOrHandle.trim();
    if (str.startsWith('@')) return str.toLowerCase();
    const handleMatch = str.match(/youtube\.com\/(@[a-zA-Z0-9_.-]+)/i);
    if (handleMatch) return handleMatch[1].toLowerCase();
    const customMatch = str.match(/youtube\.com\/c\/([a-zA-Z0-9_.-]+)/i);
    if (customMatch) return `@${customMatch[1].toLowerCase()}`;
    return null;
  }

  /**
   * Normalizes a channel title or channel name for fuzzy comparison.
   */
  static normalizeChannelName(name?: string): string {
    if (!name) return '';
    return name
      .toLowerCase()
      .replace(/[\-_.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Verifies if a given YouTube item or channel snippet matches an educator.
   * Strict anti-hallucination requirement:
   * A video whose title merely mentions the educator (e.g. "Reaction to Dinesh Sir" or "Solving Mohit Tyagi questions")
   * is REJECTED if the publishing channel does NOT match the verified educator identity.
   */
  static verifyChannelIdentity(
    item: {
      channelId?: string;
      channelTitle?: string;
      videoTitle?: string;
      videoUrl?: string;
      description?: string;
    },
    educator: MasterEducatorRecord
  ): ChannelIdentityVerification {
    // 1. Direct Channel ID Match (Highest Confidence)
    if (educator.YouTube_Channel_ID && item.channelId) {
      if (educator.YouTube_Channel_ID.trim() === item.channelId.trim()) {
        return {
          isVerifiedEducator: true,
          matchedEducator: educator,
          confidence: 'verified_channel_id',
          evidence: `Exact YouTube Channel ID match: ${item.channelId} matches ${educator.Educator_Name}`,
        };
      }
      // If educator HAS a known YouTube_Channel_ID, but the item's channelId differs,
      // this video was published by a DIFFERENT channel. Reject even if channelTitle matches!
      return {
        isVerifiedEducator: false,
        confidence: 'unverified',
        evidence: `Channel ID mismatch: Candidate channel ${item.channelId} does not match verified channel ID ${educator.YouTube_Channel_ID}`,
      };
    }

    // 2. Handle / Official Channel URL Resolution (for educators with missing Channel ID)
    const eduHandle = this.extractHandle(educator.Official_Channel_URL);
    const itemHandle = this.extractHandle(item.channelTitle) || this.extractHandle(item.videoUrl);

    if (eduHandle && itemHandle && eduHandle === itemHandle) {
      return {
        isVerifiedEducator: true,
        matchedEducator: educator,
        confidence: 'verified_handle',
        evidence: `Official YouTube channel handle match: ${eduHandle}`,
      };
    }

    // 3. Strict Channel Name Alignment
    const normChannelTitle = this.normalizeChannelName(item.channelTitle);
    const normEduChannel = this.normalizeChannelName(educator.YouTube_Channel_Name);
    const normEduName = this.normalizeChannelName(educator.Educator_Name);

    if (normChannelTitle && normEduChannel) {
      // Direct equivalence
      if (normChannelTitle === normEduChannel) {
        return {
          isVerifiedEducator: true,
          matchedEducator: educator,
          confidence: 'verified_channel_title',
          evidence: `Exact official channel name match: "${item.channelTitle}" matches "${educator.YouTube_Channel_Name}"`,
        };
      }

      // Check if channel title is an authoritative variant (e.g., "Dinesh Sir Live Study" vs "Dinesh Sir")
      const isChannelSubset =
        (normChannelTitle.includes(normEduChannel) || normEduChannel.includes(normChannelTitle)) &&
        normChannelTitle.length >= 6;

      if (isChannelSubset) {
        return {
          isVerifiedEducator: true,
          matchedEducator: educator,
          confidence: 'verified_channel_title',
          evidence: `Authoritative channel name variant match: "${item.channelTitle}" ~ "${educator.YouTube_Channel_Name}"`,
        };
      }
    }

    // 4. Reject false title mentions
    // If only the video title mentions educator, but channel title does NOT match:
    return {
      isVerifiedEducator: false,
      confidence: 'unverified',
      evidence: `No authentic creator identity match for "${item.channelTitle || 'unknown'}" with ${educator.Educator_Name}. Video title mentions alone are not verified.`,
    };
  }
}
