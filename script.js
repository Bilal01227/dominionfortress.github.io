// script.js

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  document.body.classList.toggle("light-mode");
  const isDark = document.body.classList.contains("dark-mode");
  localStorage.setItem("darkMode", isDark);
}

window.onload = function () {
  const savedMode = localStorage.getItem("darkMode") === "true";
  if (savedMode) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.add("light-mode");
  }
};

function openTerms() {
  document.getElementById('termsModal').style.display = 'block';
}

function closeTerms() {
  document.getElementById('termsModal').style.display = 'none';
}

function animateCounter(id, endValue) {
  const element = document.getElementById(id);
  let start = 0;
  const duration = 2000;
  const increment = Math.ceil(endValue / 50);

  const timer = setInterval(() => {
    start += increment;
    if (start >= endValue) {
      clearInterval(timer);
      element.textContent = endValue.toFixed(2);
    } else {
      element.textContent = start.toFixed(2);
    }
  }, 30);
}

const statsSection = document.getElementById("stats");
if (statsSection) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter("clientsCount", 1200);
        animateCounter("projectsCount", 3400);
        animateCounter("uptimeCount", 99.99);
        animateCounter("teamCount", 230);
      }
    });
  }, { threshold: 0.1 });

  observer.observe(statsSection);
}
