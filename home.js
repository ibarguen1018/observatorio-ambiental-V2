/* =========================================================
   OBSERVATORIO AMBIENTAL - Portal público (home)
   Carrusel del hero: estático, cambia solo con clic
   (flechas prev/next o puntos de navegación)
   ========================================================= */

(function(){
  const slides = Array.from(document.querySelectorAll('#hero-track .home-slide'));
  const dotsBox = document.getElementById('hero-dots');
  const btnPrev = document.getElementById('hero-prev');
  const btnNext = document.getElementById('hero-next');
  if(!slides.length) return;

  let index = slides.findIndex(s=>s.classList.contains('active'));
  if(index < 0) index = 0;

  dotsBox.innerHTML = slides.map((_,i)=>`<button data-i="${i}" aria-label="Ir a la diapositiva ${i+1}"></button>`).join('');
  const dots = Array.from(dotsBox.querySelectorAll('button'));

  function render(){
    slides.forEach((s,i)=>s.classList.toggle('active', i===index));
    dots.forEach((d,i)=>d.classList.toggle('active', i===index));
  }

  function go(i){
    index = (i + slides.length) % slides.length;
    render();
  }

  btnNext.addEventListener('click', ()=>go(index+1));
  btnPrev.addEventListener('click', ()=>go(index-1));
  dotsBox.addEventListener('click', e=>{
    const b = e.target.closest('button'); if(!b) return;
    go(Number(b.dataset.i));
  });

  render();
})();
