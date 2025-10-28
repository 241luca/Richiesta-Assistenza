export class ChunkingService {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(chunkSize = 1000, chunkOverlap = 200) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  splitText(text: string): string[] {
    const chunks: string[] = [];
    
    // Dividi per paragrafi
    const paragraphs = text.split(/\n\n+/);
    
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length <= this.chunkSize) {
        currentChunk += paragraph + '\n\n';
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        
        // Se il paragrafo è troppo lungo, spezzalo
        if (paragraph.length > this.chunkSize) {
          const subChunks = this.splitLongParagraph(paragraph);
          chunks.push(...subChunks);
          currentChunk = '';
        } else {
          currentChunk = paragraph + '\n\n';
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(c => c.length > 0);
  }

  private splitLongParagraph(paragraph: string): string[] {
    const chunks: string[] = [];
    const sentences = paragraph.split(/[.!?]+\s+/);
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= this.chunkSize) {
        currentChunk += sentence + '. ';
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence + '. ';
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
}
