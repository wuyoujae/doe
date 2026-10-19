// Origin: public/yrkie-doe/components/dashboard-widgets/dashboard-widgets.js:32


export function setHost(host, className, width, height, label) {
    host.replaceChildren();
    host.className = className;
    host.style.width = `${width}px`;
    host.style.height = `${height}px`;
    host.setAttribute("role", "img");
    host.setAttribute("aria-label", label);
  }
