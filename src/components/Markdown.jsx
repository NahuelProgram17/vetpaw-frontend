// Renderizador de Markdown liviano (sin librerías externas).
// Soporta: # ## ### títulos, **negrita**, *itálica*, `código`,
// [texto](link), listas con - o *, listas numeradas, > citas, y párrafos.

const H1 = { fontSize: 30, fontWeight: 900, color: '#fff', margin: '28px 0 14px', lineHeight: 1.25 }
const H2 = { fontSize: 23, fontWeight: 800, color: '#fff', margin: '26px 0 12px', lineHeight: 1.3 }
const H3 = { fontSize: 18, fontWeight: 800, color: '#fff', margin: '22px 0 10px' }
const P = { fontSize: 16, lineHeight: 1.8, color: 'rgba(255,255,255,0.8)', margin: '0 0 16px' }
const UL = { margin: '0 0 16px', paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 8 }
const LI = { fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)' }
const BQ = { margin: '0 0 18px', padding: '12px 18px', borderLeft: '4px solid #4CAF50', background: 'rgba(76,175,80,0.08)', borderRadius: '0 10px 10px 0', color: 'rgba(255,255,255,0.75)', fontSize: 15, lineHeight: 1.7 }
const CODE = { background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 5, fontSize: 14, fontFamily: 'monospace' }
const LINK = { color: '#6bcaff', textDecoration: 'underline' }

function renderInline(text) {
    const nodes = []
    const regex = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)|(\[[^\]]+\]\([^)]+\))/g
    let last = 0, m, key = 0
    while ((m = regex.exec(text)) !== null) {
        if (m.index > last) nodes.push(text.slice(last, m.index))
        const tok = m[0]
        if (tok.startsWith('**')) {
            nodes.push(<strong key={key++}>{tok.slice(2, -2)}</strong>)
        } else if (tok.startsWith('`')) {
            nodes.push(<code key={key++} style={CODE}>{tok.slice(1, -1)}</code>)
        } else if (tok.startsWith('[')) {
            const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok)
            nodes.push(<a key={key++} href={mm[2]} target="_blank" rel="noopener noreferrer" style={LINK}>{mm[1]}</a>)
        } else if (tok.startsWith('*')) {
            nodes.push(<em key={key++}>{tok.slice(1, -1)}</em>)
        }
        last = m.index + tok.length
    }
    if (last < text.length) nodes.push(text.slice(last))
    return nodes
}

const isSpecial = (l) => /^(#{1,3}\s|>\s?|[-*]\s|\d+\.\s)/.test(l)

export default function Markdown({ text }) {
    const lines = (text || '').replace(/\r\n/g, '\n').split('\n')
    const blocks = []
    let i = 0, key = 0

    while (i < lines.length) {
        const line = lines[i]
        if (!line.trim()) { i++; continue }

        if (/^###\s/.test(line)) { blocks.push(<h3 key={key++} style={H3}>{renderInline(line.replace(/^###\s/, ''))}</h3>); i++; continue }
        if (/^##\s/.test(line)) { blocks.push(<h2 key={key++} style={H2}>{renderInline(line.replace(/^##\s/, ''))}</h2>); i++; continue }
        if (/^#\s/.test(line)) { blocks.push(<h1 key={key++} style={H1}>{renderInline(line.replace(/^#\s/, ''))}</h1>); i++; continue }

        if (/^>\s?/.test(line)) {
            const items = []
            while (i < lines.length && /^>\s?/.test(lines[i])) { items.push(lines[i].replace(/^>\s?/, '')); i++ }
            blocks.push(<blockquote key={key++} style={BQ}>{renderInline(items.join(' '))}</blockquote>)
            continue
        }

        if (/^[-*]\s/.test(line)) {
            const items = []
            while (i < lines.length && /^[-*]\s/.test(lines[i])) { items.push(lines[i].replace(/^[-*]\s/, '')); i++ }
            blocks.push(<ul key={key++} style={UL}>{items.map((it, idx) => <li key={idx} style={LI}>{renderInline(it)}</li>)}</ul>)
            continue
        }

        if (/^\d+\.\s/.test(line)) {
            const items = []
            while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s/, '')); i++ }
            blocks.push(<ol key={key++} style={UL}>{items.map((it, idx) => <li key={idx} style={LI}>{renderInline(it)}</li>)}</ol>)
            continue
        }

        const para = []
        while (i < lines.length && lines[i].trim() && !isSpecial(lines[i])) { para.push(lines[i]); i++ }
        blocks.push(<p key={key++} style={P}>{renderInline(para.join(' '))}</p>)
    }

    return <div>{blocks}</div>
}
