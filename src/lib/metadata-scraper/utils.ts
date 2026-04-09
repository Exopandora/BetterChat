/**
 * MIT License
 *
 * Copyright (c) 2021 Maximilian Schiller
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

export function makeUrlAbsolute(base: string, relative: string): string {
    try {
        return new URL(relative).href;
    } catch (e1) {
        try {
            return new URL(relative, base).href;
        } catch (e2) {
            return relative;
        }
    }
}

export function makeUrlSecure(url: string): string {
    return url.replace(/^http:/, "https:");
}

export function parseUrl(url: string): string {
    try {
        return new URL(url).href;
    } catch (e) {
        return "";
    }
}

export function getProvider(host: string): string {
    return host.replace(/www[a-zA-Z0-9]*\./, "")
        .replace(".co.", ".")
        .split(".")
        .slice(0, -1)
        .join(" ");
}
