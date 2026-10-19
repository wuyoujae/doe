// These are optional breaks in contact information, not permission to split
// arbitrary identifiers, numbers, or words. Keep protocol punctuation together.
const CONTACT = /^(?:[([{"'“‘「『《〈（【]\s*)*(https?:\/\/[^\s，。；！？]+|www\.[^\s，。；！？]+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/u;
const SEPARATORS = /[@./?&#=+_\-:~]+/gu;

export function wrapContactTokens(segmentation, widthPx, measure, protectedTerms) {
    const terms = (Array.isArray(protectedTerms) ? protectedTerms : [])
        .map(term => String(term || '').trim()).filter(Boolean);
    let changed = false;
    const paragraphs = segmentation.paragraphs.map((tokens, paragraphIndex) => {
        const source = segmentation.paragraphSources[paragraphIndex];
        return tokens.flatMap(token => {
            const contact = CONTACT.exec(token.text);
            if (!contact || measure(token.text, token, paragraphIndex) <= widthPx + 0.25) return [token];
            const start = contact[0].length - contact[1].length;
            const endOfContact = start + contact[1].replace(/[)\]}”’」』》〉）】,;.!?"']+$/u, '').length;
            const protocolEnd = /^https?:\/\//u.exec(contact[1])?.[0].length || 0;
            const ends = [...contact[1].matchAll(SEPARATORS)]
                .map(match => start + match.index + match[0].length)
                .filter(end => end >= start + protocolEnd && end < endOfContact)
                .filter(end => !terms.some(term => {
                    const boundary = token.start + end;
                    const termStart = source.lastIndexOf(term, boundary - 1);
                    return termStart >= 0 && termStart + term.length > boundary;
                }));
            if (!ends.length) return [token];
            changed = true;
            let previous = 0;
            return [...ends, token.text.length].map(end => {
                const part = {
                    ...token,
                    text: token.text.slice(previous, end),
                    start: token.start + previous,
                    end: token.start + end,
                    gapBefore: previous === 0 ? token.gapBefore : '',
                    spaceBefore: previous === 0 && token.spaceBefore,
                    trailing: end === token.text.length ? token.trailing : '',
                };
                previous = end;
                return part;
            });
        });
    });
    return changed ? { ...segmentation, paragraphs, tokens: paragraphs.flat() } : segmentation;
}
