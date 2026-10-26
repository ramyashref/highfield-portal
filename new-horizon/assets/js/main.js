(() => {
  const container = document.getElementById("particles");
  if (container) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = reducedMotion ? 0 : (window.matchMedia("(max-width: 720px)").matches ? 20 : 38);
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const particle = document.createElement("span");
      particle.className = "particle";
      particle.style.left = Math.random() * 100 + "%";
      particle.style.top = (25 + Math.random() * 80) + "%";
      particle.style.animationDuration = (5 + Math.random() * 9) + "s";
      particle.style.animationDelay = (-Math.random() * 12) + "s";
      particle.style.opacity = (0.25 + Math.random() * 0.7).toFixed(2);
      const size = 1 + Math.random() * 2.5;
      particle.style.width = size + "px";
      particle.style.height = size + "px";
      fragment.appendChild(particle);
    }
    container.appendChild(fragment);
  }

  const visual = document.querySelector(".visual");
  const frame = document.getElementById("visualFrame");
  if (!visual || !frame) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(pointer: coarse)").matches) return;

  let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
  let animationFrame = null;

  function animate() {
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;
    frame.style.transform = `rotateX(${currentX}deg) rotateY(${currentY}deg)`;
    if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      animationFrame = null;
    }
  }

  visual.addEventListener("mousemove", (event) => {
    const rect = visual.getBoundingClientRect();
    targetY = ((event.clientX - rect.left) / rect.width - 0.5) * 5;
    targetX = (0.5 - (event.clientY - rect.top) / rect.height) * 4;
    if (!animationFrame) animate();
  });

  visual.addEventListener("mouseleave", () => {
    targetX = 0;
    targetY = 0;
    if (!animationFrame) animate();
  });
})();
