export function clearDropIndicator(root) {
  root?.querySelectorAll('.doe-drop-indicator').forEach(line => line.remove());
  root?.querySelectorAll('.has-insertion-indicator').forEach(target => target.classList.remove('has-insertion-indicator'));
}
