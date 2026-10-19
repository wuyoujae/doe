// Origin: public/yrkie-doe/core/contents-model.js:36

export function currentChoice(node) {
        if (node.type === 'stat' || node.type === 'layout-group' && node.layout?.collectionKey === 'kpi') return 'metrics';
        if (node.type === 'contents')
            return node.props?.presentation === 'bullets' ? 'list:unordered' : node.props?.presentation;
        if (['icon-text', 'image-text'].includes(node.type))
            return node.type;
        if (node.type === 'item-cards')
            return `cards:${node.props?.variant || 'filled'}`;
        if (node.type === 'shape-contents')
            return `shape:${node.props?.variant || 'semicircle'}`;
        if (node.type === 'layout-group')
            return node.layout?.variant === 'columns' ? 'columns'
                : ({ 'question-card': 'question', quote: 'quotation', 'icon-text': 'icon-text', 'image-text': 'image-text' })[node.layout?.collectionKey];
        return ({ list: 'list:unordered', 'ordered-list': 'list:ordered', 'capability-cards': 'capability', 'numbered-icon-cards': 'numbered', 'question-card': 'question', quote: 'quotation' })[node.type];
    }
