export const DIRECTIONAL_PROCESS_HEADERS = ['numbered-chevron', 'numbered-pill', 'numbered-parallelogram'];

export function directionalProcessHeader(props) {
  return DIRECTIONAL_PROCESS_HEADERS.includes(props?.presentation);
}

export function processOrientation(props, context = {}) {
  return context.compressionOrientation || (props?.orientation === 'vertical' ? 'vertical' : 'horizontal');
}
