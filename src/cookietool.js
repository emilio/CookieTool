/** Main class */
window.CookieTool = function() {};

/** Utility functions */
CookieTool.Utils = {
	/**
	 * Extend an object
	 * @param {Object} obj1
	 * @param {Object} obj2
	 * @return {Object} the merged object
	 */
	extend: function(obj1, obj2) {
		var ret = obj1,
			prop;
		for (prop in obj2) {
			if(obj2.hasOwnProperty(prop)) {
				ret[prop] = obj2[prop];
			}
		}
		return ret;
	},

	/**
	 * Load a script asynchronously
	 * @param {String} src the script src
	 * @param {Function} callback an optionall callback
	 */
	 loadScript: (function() {
	 	var firstjs = document.getElementsByTagName('script')[0];

	 	return function(src, callback) {
			var s = document.createElement('script'),
				loaded;
			s.async = true;
			s.onload = s.onreadystatechange = function() {
				if( ! loaded && (! s.readyState || s.readyState === 'complete' || s.readyState === 'loaded') ) {
					loaded = true;
					if( callback && typeof callback === 'function' ) {
						callback.call(null, s);
					}
				}
			};
			s.src = src;
			firstjs.parentNode.insertBefore(s, firstjs);
		}
	 }())
}

CookieTool.Config = (function() {
	var config = {
		'position': 'top',
		'message': 'En este sitio se usan cookies para ofrecer una experiencia más personalizada. <a href="{{link}}" target="_blank">Más información</a>.<br>¿Nos consiente usar cookies?',
		'link': '/cookies',
		'agreetext': 'Sí',
		'declinetext': 'No'
	}

	return {
		get: function(key) {
			return config[key];
		},
		set: function(key, val) {
			if( typeof key === 'string' ) {
				config[key] = val;
			} else {
				config = CookieTool.Utils.extend(config, key);
			}
		}
	}
}());

/**
 * Event API for customisation
 */
CookieTool.Event = (function() {
	/** Where the callbacks are stored */
	var events = {};
	return {
		/**
		 * Add an event listener
		 * @param {String} name the identifier
		 * @param {Function} callback
		 * @return undefined
		 */
		on: function(name, callback) {
			if( events[name] === undefined ) {
				events[name] = [];
			}
			if( typeof callback === 'function' ) {
				events[name].push(callback);
			}
		},
		/**
		 * Trigger all event listeners for an identifier
		 * @param {String} name the identifier
		 * @return undefined
		 */
		trigger: function(name) {
			var cbs = events[name],
				i = 0,
				len;

			if( ! cbs ) {
				return;
			}
			len = cbs.length;
			for (; i < len; i++) {
				cbs[i]();
			}
		}
	}
}());


/**
 * Cookie functions
 */
CookieTool.Cookie = {
	/**
	 * Get a cookie value
	 * @param {String} key
	 * @return {String} the value
	 */
	get: function(key) {
		return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(key).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
	},

	/**
	 * Set a cookie value
	 * @param {String} key
	 * @param {String} value
	 * @param {Number} days
	 * @param {String} domain
	 * @param {String} path
	 */
	set: function(key, value, days, domain, path) {
		var cookie = key + "=" + encodeURIComponent(value),
			date;
		if (days) {
			date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			cookie += "; expires="+date.toGMTString();
		}
		if ( domain ) {
			cookie += "; domain=" + domain
		}
		if( ! path ) {
			path = "/";
		}
		cookie +=  "; path=" + path;
		document.cookie = cookie;
	},

	/**
	 * Delete a cookie
	 * @param {String} key
	 * @param {String} domain necessary for GA cookies
	 */
	remove: function(key, domain) {
		CookieTool.Cookie.set(key,"",-1, domain);
	}
}

/**
 * Storage functions (HTML5 localStorage based) (permanent storage)
 */
if( window.localStorage ) {
	CookieTool.Storage = {
		/**
		 * Get a stored value
		 * @param {String} key
		 * @return {String} the value
		 */
		get: function(key) {
			return window.localStorage.getItem(key);
		},
		/**
		 * Set a value
		 * @param {String} key
		 * @param {String} value
		 */
		set: function(key, value) {
			return window.localStorage.setItem(key, value);
		},
		/**
		 * Delete a stored value
		 * @param {String} key
		 */
		remove: function(key) {
			return window.localStorage.removeItem(key);
		}
	}
} else {
	// Cookie based storage
	CookieTool.Storage = CookieTool.Cookie;
}

/**
 * Main API
 */
CookieTool.API = {
	/**
	 * Some status codes
	 */
	statuses: {
		'AGREE': '1',
		'DECLINE': '0',
		'UNDETERMINED': null
	},
	/**
	 * Set/get the current status of tracking
	 */
	status: function(value) {
		if( value === undefined ) {
			return CookieTool.Storage.get('ctstatus');
		}
		if( CookieTool.API.statuses[value] ) {
			return CookieTool.Storage.set('ctstatus', CookieTool.API.statuses[value], 365);
		}
		return CookieTool.Storage.set('ctstatus', value, 365);
	},

	/**
	 * Ask for cookie consenting
	 */
	ask: function() {
		var message,
			status,
			body = document.body;
		// Already agreed
		if( CookieTool.API.status() === CookieTool.API.statuses.AGREE ) {
			return CookieTool.API.agree();
		}

		if( CookieTool.API.status() === CookieTool.API.statuses.DECLINE ) {
			return CookieTool.API.decline();
		}

		message = document.createElement('div');
		message.className = 'cookietool-message cookietool-message-' + CookieTool.Config.get('position');
		body.className += ' cookietool';
		// No overcomplications with event listeners
		message.onclick = function(e) {
			var e = e || window.event,
				target = e.target || e.srcElement,
				action = target.getAttribute('data-action');
			if( action && CookieTool.API[action] ) {
				CookieTool.API[action]();
				if( e.preventDefault ) {
					e.preventDefault();
				} else {
					e.returnValue = false;
				}
				message.parentNode.removeChild(message);
				body.className = body.className.replace(/\bcookietool\b/, '');
				return false;
			}
		}

		// onclick="" in <button>'s to fix event delegation in Safari for iPhone: http://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
		message.innerHTML = '<p>' + CookieTool.Config.get('message').replace(/\{\{link\}\}/g, CookieTool.Config.get('link')) + '</p><button data-action="agree" onclick="">' + CookieTool.Config.get('agreetext') + '</button> <button data-action="decline" onclick="">' + CookieTool.Config.get('declinetext') + '</button>';
		body.appendChild(message);
	},

	/**
	 * Assume implied agreement
	 * Note that you'll need at least somewhere in your page a link with a decline option (eg: <button onclick="CookieTool.API.decline()">I don't want cookies</button>)
	 */
	impliedAgreement: function() {
		var status = CookieTool.API.status();
		switch(status) {
			case CookieTool.API.statuses.DECLINE:
				CookieTool.API.decline();
				break;
			// case CookieTool.API.statuses.UNDETERMINED:
			// case CookieTool.API.statuses.AGREE:
			default:
				CookieTool.API.agree();
		}
	},

	displaySettings: function(container) {
		var status = CookieTool.API.status();
		if( ! container ) {
			return;
		}

		container.className += ' cookietool-settings';
		container.onclick = function(e) {
			var e = e || window.event,
				target = e.target || e.srcElement,
				action = target.getAttribute('data-action');
				console.log();
			if( action && CookieTool.API[action] ) {
				CookieTool.API[action]();
				CookieTool.API.displaySettings(container);
				if( e.preventDefault ) {
					e.preventDefault();
				} else {
					e.returnValue = false;
				}
				return false;
			}
		}

		if( status === CookieTool.API.statuses.AGREE ) {
			container.innerHTML = 'Actualmente <strong>aceptas</strong> el uso de cookies en el sitio. <a role="button" data-action="decline" href="#">Pulsa aquí para no permitir cookies</a>';
		} else if ( status === CookieTool.API.statuses.DECLINE ) {
			container.innerHTML = 'Actualmente <strong>no aceptas</strong> el uso de cookies en el sitio. <a role="button" data-action="agree" href="#">Pulsa aquí para permitir cookies</a>'
		} else {
			container.innerHTML = 'Aún no has establecido tu configuración. Haz click <a role="button" data-action="agree" href="#">aquí</a> si quieres aceptar el uso de cookies, o <a role="button" data-action="decline" href="#">aquí</a> si no.';
		}
	},
	/**
	 * Agree
	 */
	 agree: function() {
	 	CookieTool.API.status('AGREE');
	 	CookieTool.Event.trigger('agree');
	 },

	 /**
	  * Decline
	  */
	 decline: function() {
	 	CookieTool.API.status('DECLINE');
	 	CookieTool.Event.trigger('decline');
	 }
}

/**
 * Default id for settings, allows to put the script at the footer with no worries
 */
 if( document.getElementById('cookietool-settings') ) {
 	CookieTool.API.displaySettings(document.getElementById('cookietool-settings'));
 }


/**
 * Default behaviour on agree: Load google analytics and adsense if present
 */
CookieTool.Event.on('agree', function() {
	if( window.adsbygoogle ) {
		CookieTool.Utils.loadScript('http://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js');
	}
	if( window._gaq ) {
		CookieTool.Utils.loadScript(('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js');
	} else if ( window.ga ) {
		CookieTool.Utils.loadScript('//wwww.google-analytics.com/analytics.js');
	}
});

/**
 * Default behaviour on decline: Delete GA cookies
 */
 CookieTool.Event.on('decline', function() {
	var cookiestodelete = ['__utma', '__utmb', '__utmc', '__utmz', '__utmv'],
		i = 0,
		len = cookiestodelete.length,
		domain = window.location.hostname;
	if( (/^www\./).test(domain) ) {
		domain = domain.substring(4);
	}

	for( ; i < len; i++) {
		CookieTool.Cookie.remove(cookiestodelete[i], domain);
	}
});
