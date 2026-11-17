(function(){
  var KEY_SIZE = 'gss-size', KEY_LAST = 'gss-last';
  function get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function set(k, v){ try { localStorage.setItem(k, v); } catch(e){} }
  var size = parseInt(get(KEY_SIZE), 10);
  if (!(size >= 0 && size <= 5)) size = 1;
  document.documentElement.setAttribute('data-size', size);
  document.addEventListener('DOMContentLoaded', function(){
    var btns = document.querySelectorAll('[data-size]');
    for (var i = 0; i < btns.length; i++) btns[i].addEventListener('click', function(){
      size = Math.max(0, Math.min(5, size + parseInt(this.getAttribute('data-size'), 10)));
      document.documentElement.setAttribute('data-size', size);
      set(KEY_SIZE, size);
    });
    var page = document.body.getAttribute('data-page');
    if (page) { set(KEY_LAST, JSON.stringify({ href: page, title: document.querySelector('h1').firstChild.textContent, where: document.querySelector('.where').textContent })); return; }
    var box = document.getElementById('resume'), last = null;
    try { last = JSON.parse(get(KEY_LAST)); } catch(e){}
    if (box && last && last.href) {
      var a = document.createElement('a');
      a.className = 'btn next'; a.href = last.href;
      a.textContent = '읽던 곳 이어 읽기';
      var s = document.createElement('span'); s.textContent = last.where + ' · ' + last.title;
      a.appendChild(s); box.appendChild(a); box.hidden = false;
    }
  });
})();
