export class StringReader {
    string: string;
    cursor: number;

    constructor(string: string, cursor: number = 0) {
        this.string = string;
        this.cursor = cursor;
    }

    canRead(offset = 0): boolean {
        return this.cursor + offset < this.string.length;
    }

    peek(offset = 0): string {
        return this.string.charAt(this.cursor + offset);
    }

    read(): string {
        return this.string.charAt(this.cursor++);
    }

    skip() {
        this.cursor++;
    }

    copy(): StringReader {
        return new StringReader(this.string, this.cursor);
    }
}
