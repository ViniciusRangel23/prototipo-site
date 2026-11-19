(function () {
	// Menu no celular.
	var botao = document.querySelector('.topo__botao');
	var nav = document.getElementById('navegacao');
	if (botao && nav) {
		botao.addEventListener('click', function () {
			var aberto = nav.classList.toggle('is-aberta');
			botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
		});
	}

	// Filtro de municípios por nome e por região.
	var lista = document.querySelector('[data-cidades]');
	if (!lista) return;
	var campo = document.querySelector('[data-filtro-cidade]');
	var vazio = document.querySelector('[data-cidades-vazio]');
	var regioes = document.querySelectorAll('.regiao');
	var regiaoAtual = '';
	var mais = document.querySelector('[data-cidades-mais]');
	var aberta = !mais;
	if (mais) {
		mais.addEventListener('click', function () {
			aberta = true;
			filtrar();
		});
	}

	function semAcento(t) {
		return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
	}

	function filtrar() {
		var termo = campo ? semAcento(campo.value.trim()) : '';
		var visiveis = 0;
		lista.querySelectorAll('li').forEach(function (li) {
			var ok = semAcento(li.textContent).indexOf(termo) !== -1 && (!regiaoAtual || li.dataset.regiao === regiaoAtual);
			li.hidden = !ok;
			if (ok) visiveis++;
		});
		if (vazio) vazio.hidden = visiveis > 0;
		// Recolhida (só no celular, pelo CSS) enquanto não houver busca nem filtro de região.
		lista.classList.toggle('is-recolhida', !aberta && !termo && !regiaoAtual);
		// No mapa, apaga os consorciados que ficaram fora do filtro.
		document.querySelectorAll('.mapa__municipio.is-consorciado').forEach(function (m) {
			var ok = semAcento(m.dataset.nome).indexOf(termo) !== -1 && (!regiaoAtual || m.dataset.regiao === regiaoAtual);
			m.classList.toggle('is-apagado', !ok);
		});
	}

	if (mais) filtrar();
	if (campo) campo.addEventListener('input', filtrar);
	regioes.forEach(function (b) {
		b.addEventListener('click', function () {
			regiaoAtual = b.dataset.regiao;
			regioes.forEach(function (o) {
				o.classList.toggle('is-ativa', o === b);
				o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
			});
			filtrar();
		});
	});
})();

// Mapa: nome do município ao passar o mouse; nos consorciados, um card com os dados.
(function () {
	var mapa = document.querySelector('[data-mapa]');
	if (!mapa) return;
	var dica = mapa.querySelector('[data-mapa-dica]');
	var atual = null;

	function montar(m) {
		dica.textContent = '';
		var consorciado = m.classList.contains('is-consorciado');
		dica.classList.toggle('is-card', consorciado);
		if (consorciado && m.dataset.regiaoNome) {
			var regiao = document.createElement('p');
			regiao.className = 'mapa__dica-regiao';
			regiao.textContent = m.dataset.regiaoNome;
			dica.appendChild(regiao);
		}
		var nome = document.createElement('p');
		nome.className = 'mapa__dica-nome';
		nome.textContent = m.dataset.nome;
		dica.appendChild(nome);
		if (!consorciado) return;
		var dados = JSON.parse(m.dataset.card || '{}');
		var lista = document.createElement('dl');
		Object.keys(dados).forEach(function (rotulo) {
			var linha = document.createElement('div');
			var dt = document.createElement('dt');
			var dd = document.createElement('dd');
			dt.textContent = rotulo;
			dd.textContent = dados[rotulo];
			linha.appendChild(dt);
			linha.appendChild(dd);
			lista.appendChild(linha);
		});
		if (lista.children.length) dica.appendChild(lista);
		var mais = document.createElement('p');
		mais.className = 'mapa__dica-mais';
		mais.textContent = 'Clique para ver o município →';
		dica.appendChild(mais);
	}

	mapa.addEventListener('pointermove', function (e) {
		var m = e.target.closest('.mapa__municipio');
		mapa.classList.toggle('is-focando', !!m && m.classList.contains('is-consorciado'));
		if (!m) {
			dica.hidden = true;
			atual = null;
			return;
		}
		if (m !== atual) {
			atual = m;
			montar(m);
			dica.hidden = false;
		}
		// Posiciona perto do cursor, sem passar da borda do mapa.
		var caixa = mapa.getBoundingClientRect();
		var x = e.clientX - caixa.left + 16;
		var y = e.clientY - caixa.top + 16;
		if (x + dica.offsetWidth > caixa.width) x = e.clientX - caixa.left - dica.offsetWidth - 16;
		dica.style.transform = 'translate(' + Math.max(0, x) + 'px, ' + y + 'px)';
	});
	mapa.addEventListener('pointerleave', function () {
		mapa.classList.remove('is-focando');
		dica.hidden = true;
		atual = null;
	});

	// Passar o mouse (ou o foco do teclado) num nome da lista destaca o município no mapa e mostra o card.
	var municipios = mapa.querySelectorAll('.mapa__municipio.is-consorciado');
	function destacar(link) {
		var alvo = null;
		municipios.forEach(function (m) {
			var igual = m.getAttribute('href') === link.getAttribute('href');
			m.classList.toggle('is-destacado', igual);
			if (igual) alvo = m;
		});
		if (!alvo) return;
		mapa.classList.add('is-focando');
		atual = alvo;
		montar(alvo);
		dica.hidden = false;
		// Card ao lado do município, sem passar da borda do mapa.
		var caixa = mapa.getBoundingClientRect();
		var forma = alvo.getBoundingClientRect();
		var x = forma.right - caixa.left + 12;
		var y = forma.top - caixa.top + forma.height / 2 - dica.offsetHeight / 2;
		if (x + dica.offsetWidth > caixa.width) x = forma.left - caixa.left - dica.offsetWidth - 12;
		dica.style.transform = 'translate(' + Math.max(0, x) + 'px, ' + Math.max(0, y) + 'px)';
	}
	function apagar() {
		municipios.forEach(function (m) {
			m.classList.remove('is-destacado');
		});
		mapa.classList.remove('is-focando');
		dica.hidden = true;
		atual = null;
	}
	document.querySelectorAll('[data-cidades] a').forEach(function (link) {
		link.addEventListener('mouseenter', function () { destacar(link); });
		link.addEventListener('focus', function () { destacar(link); });
		link.addEventListener('mouseleave', apagar);
		link.addEventListener('blur', apagar);
	});
})();
