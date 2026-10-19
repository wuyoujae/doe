// Origin: public/yrkie-doe/core/contents-model.js:176


export function findNode(nodes, id) {
        for (const node of nodes) {
            if (node.id === id)
                return node;
            const nested = (0, findNode)(node.children || [], id);
            if (nested)
                return nested;
        }
    }
