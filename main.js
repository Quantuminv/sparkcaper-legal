(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@capacitor/core/dist/index.js
  var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
  var init_dist = __esm({
    "node_modules/@capacitor/core/dist/index.js"() {
      (function(ExceptionCode2) {
        ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
        ExceptionCode2["Unavailable"] = "UNAVAILABLE";
      })(ExceptionCode || (ExceptionCode = {}));
      CapacitorException = class extends Error {
        constructor(message, code, data) {
          super(message);
          this.message = message;
          this.code = code;
          this.data = data;
        }
      };
      getPlatformId = (win) => {
        var _a, _b;
        if (win === null || win === void 0 ? void 0 : win.androidBridge) {
          return "android";
        } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
          return "ios";
        } else {
          return "web";
        }
      };
      createCapacitor = (win) => {
        const capCustomPlatform = win.CapacitorCustomPlatform || null;
        const cap = win.Capacitor || {};
        const Plugins = cap.Plugins = cap.Plugins || {};
        const getPlatform = () => {
          return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
        };
        const isNativePlatform = () => getPlatform() !== "web";
        const isPluginAvailable = (pluginName) => {
          const plugin = registeredPlugins.get(pluginName);
          if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            return true;
          }
          if (getPluginHeader(pluginName)) {
            return true;
          }
          return false;
        };
        const getPluginHeader = (pluginName) => {
          var _a;
          return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
        };
        const handleError = (err) => win.console.error(err);
        const registeredPlugins = /* @__PURE__ */ new Map();
        const registerPlugin2 = (pluginName, jsImplementations = {}) => {
          const registeredPlugin = registeredPlugins.get(pluginName);
          if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
          }
          const platform = getPlatform();
          const pluginHeader = getPluginHeader(pluginName);
          let jsImplementation;
          const loadPluginImplementation = async () => {
            if (!jsImplementation && platform in jsImplementations) {
              jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
            } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
              jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
            }
            return jsImplementation;
          };
          const createPluginMethod = (impl, prop) => {
            var _a, _b;
            if (pluginHeader) {
              const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
              if (methodHeader) {
                if (methodHeader.rtype === "promise") {
                  return (options) => cap.nativePromise(pluginName, prop.toString(), options);
                } else {
                  return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
                }
              } else if (impl) {
                return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
              }
            } else if (impl) {
              return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            } else {
              throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
          };
          const createPluginMethodWrapper = (prop) => {
            let remove;
            const wrapper = (...args) => {
              const p = loadPluginImplementation().then((impl) => {
                const fn = createPluginMethod(impl, prop);
                if (fn) {
                  const p2 = fn(...args);
                  remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                  return p2;
                } else {
                  throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
                }
              });
              if (prop === "addListener") {
                p.remove = async () => remove();
              }
              return p;
            };
            wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, "name", {
              value: prop,
              writable: false,
              configurable: false
            });
            return wrapper;
          };
          const addListener = createPluginMethodWrapper("addListener");
          const removeListener = createPluginMethodWrapper("removeListener");
          const addListenerNative = (eventName, callback) => {
            const call = addListener({ eventName }, callback);
            const remove = async () => {
              const callbackId = await call;
              removeListener({
                eventName,
                callbackId
              }, callback);
            };
            const p = new Promise((resolve) => call.then(() => resolve({ remove })));
            p.remove = async () => {
              console.warn(`Using addListener() without 'await' is deprecated.`);
              await remove();
            };
            return p;
          };
          const proxy = new Proxy({}, {
            get(_, prop) {
              switch (prop) {
                // https://github.com/facebook/react/issues/20030
                case "$$typeof":
                  return void 0;
                case "toJSON":
                  return () => ({});
                case "addListener":
                  return pluginHeader ? addListenerNative : addListener;
                case "removeListener":
                  return removeListener;
                default:
                  return createPluginMethodWrapper(prop);
              }
            }
          });
          Plugins[pluginName] = proxy;
          registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
          });
          return proxy;
        };
        if (!cap.convertFileSrc) {
          cap.convertFileSrc = (filePath) => filePath;
        }
        cap.getPlatform = getPlatform;
        cap.handleError = handleError;
        cap.isNativePlatform = isNativePlatform;
        cap.isPluginAvailable = isPluginAvailable;
        cap.registerPlugin = registerPlugin2;
        cap.Exception = CapacitorException;
        cap.DEBUG = !!cap.DEBUG;
        cap.isLoggingEnabled = !!cap.isLoggingEnabled;
        return cap;
      };
      initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
      Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
      registerPlugin = Capacitor.registerPlugin;
      WebPlugin = class {
        constructor() {
          this.listeners = {};
          this.retainedEventArguments = {};
          this.windowListeners = {};
        }
        addListener(eventName, listenerFunc) {
          let firstListener = false;
          const listeners = this.listeners[eventName];
          if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
          }
          this.listeners[eventName].push(listenerFunc);
          const windowListener = this.windowListeners[eventName];
          if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
          }
          if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
          }
          const remove = async () => this.removeListener(eventName, listenerFunc);
          const p = Promise.resolve({ remove });
          return p;
        }
        async removeAllListeners() {
          this.listeners = {};
          for (const listener in this.windowListeners) {
            this.removeWindowListener(this.windowListeners[listener]);
          }
          this.windowListeners = {};
        }
        notifyListeners(eventName, data, retainUntilConsumed) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            if (retainUntilConsumed) {
              let args = this.retainedEventArguments[eventName];
              if (!args) {
                args = [];
              }
              args.push(data);
              this.retainedEventArguments[eventName] = args;
            }
            return;
          }
          listeners.forEach((listener) => listener(data));
        }
        hasListeners(eventName) {
          var _a;
          return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
        }
        registerWindowListener(windowEventName, pluginEventName) {
          this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event) => {
              this.notifyListeners(pluginEventName, event);
            }
          };
        }
        unimplemented(msg = "not implemented") {
          return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
        }
        unavailable(msg = "not available") {
          return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
        }
        async removeListener(eventName, listenerFunc) {
          const listeners = this.listeners[eventName];
          if (!listeners) {
            return;
          }
          const index = listeners.indexOf(listenerFunc);
          if (index !== -1) {
            this.listeners[eventName].splice(index, 1);
          }
          if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
          }
        }
        addWindowListener(handle) {
          window.addEventListener(handle.windowEventName, handle.handler);
          handle.registered = true;
        }
        removeWindowListener(handle) {
          if (!handle) {
            return;
          }
          window.removeEventListener(handle.windowEventName, handle.handler);
          handle.registered = false;
        }
        sendRetainedArgumentsForEvent(eventName) {
          const args = this.retainedEventArguments[eventName];
          if (!args) {
            return;
          }
          delete this.retainedEventArguments[eventName];
          args.forEach((arg) => {
            this.notifyListeners(eventName, arg);
          });
        }
      };
      encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
      decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
      CapacitorCookiesPluginWeb = class extends WebPlugin {
        async getCookies() {
          const cookies = document.cookie;
          const cookieMap = {};
          cookies.split(";").forEach((cookie) => {
            if (cookie.length <= 0)
              return;
            let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
          });
          return cookieMap;
        }
        async setCookie(options) {
          try {
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
            const path = (options.path || "/").replace("path=", "");
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
            document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async deleteCookie(options) {
          try {
            document.cookie = `${options.key}=; Max-Age=0`;
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearCookies() {
          try {
            const cookies = document.cookie.split(";") || [];
            for (const cookie of cookies) {
              document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
            }
          } catch (error) {
            return Promise.reject(error);
          }
        }
        async clearAllCookies() {
          try {
            await this.clearCookies();
          } catch (error) {
            return Promise.reject(error);
          }
        }
      };
      CapacitorCookies = registerPlugin("CapacitorCookies", {
        web: () => new CapacitorCookiesPluginWeb()
      });
      readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result;
          resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
      });
      normalizeHttpHeaders = (headers = {}) => {
        const originalKeys = Object.keys(headers);
        const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
        const normalized = loweredKeys.reduce((acc, key, index) => {
          acc[key] = headers[originalKeys[index]];
          return acc;
        }, {});
        return normalized;
      };
      buildUrlParams = (params, shouldEncode = true) => {
        if (!params)
          return null;
        const output = Object.entries(params).reduce((accumulator, entry) => {
          const [key, value] = entry;
          let encodedValue;
          let item;
          if (Array.isArray(value)) {
            item = "";
            value.forEach((str) => {
              encodedValue = shouldEncode ? encodeURIComponent(str) : str;
              item += `${key}=${encodedValue}&`;
            });
            item.slice(0, -1);
          } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
          }
          return `${accumulator}&${item}`;
        }, "");
        return output.substr(1);
      };
      buildRequestInit = (options, extra = {}) => {
        const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
        const headers = normalizeHttpHeaders(options.headers);
        const type = headers["content-type"] || "";
        if (typeof options.data === "string") {
          output.body = options.data;
        } else if (type.includes("application/x-www-form-urlencoded")) {
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(options.data || {})) {
            params.set(key, value);
          }
          output.body = params.toString();
        } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
          const form = new FormData();
          if (options.data instanceof FormData) {
            options.data.forEach((value, key) => {
              form.append(key, value);
            });
          } else {
            for (const key of Object.keys(options.data)) {
              form.append(key, options.data[key]);
            }
          }
          output.body = form;
          const headers2 = new Headers(output.headers);
          headers2.delete("content-type");
          output.headers = headers2;
        } else if (type.includes("application/json") || typeof options.data === "object") {
          output.body = JSON.stringify(options.data);
        }
        return output;
      };
      CapacitorHttpPluginWeb = class extends WebPlugin {
        /**
         * Perform an Http request given a set of options
         * @param options Options to build the HTTP request
         */
        async request(options) {
          const requestInit = buildRequestInit(options, options.webFetchExtra);
          const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
          const url = urlParams ? `${options.url}?${urlParams}` : options.url;
          const response = await fetch(url, requestInit);
          const contentType = response.headers.get("content-type") || "";
          let { responseType = "text" } = response.ok ? options : {};
          if (contentType.includes("application/json")) {
            responseType = "json";
          }
          let data;
          let blob;
          switch (responseType) {
            case "arraybuffer":
            case "blob":
              blob = await response.blob();
              data = await readBlobAsBase64(blob);
              break;
            case "json":
              data = await response.json();
              break;
            case "document":
            case "text":
            default:
              data = await response.text();
          }
          const headers = {};
          response.headers.forEach((value, key) => {
            headers[key] = value;
          });
          return {
            data,
            headers,
            status: response.status,
            url: response.url
          };
        }
        /**
         * Perform an Http GET request given a set of options
         * @param options Options to build the HTTP request
         */
        async get(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
        }
        /**
         * Perform an Http POST request given a set of options
         * @param options Options to build the HTTP request
         */
        async post(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
        }
        /**
         * Perform an Http PUT request given a set of options
         * @param options Options to build the HTTP request
         */
        async put(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
        }
        /**
         * Perform an Http PATCH request given a set of options
         * @param options Options to build the HTTP request
         */
        async patch(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
        }
        /**
         * Perform an Http DELETE request given a set of options
         * @param options Options to build the HTTP request
         */
        async delete(options) {
          return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
        }
      };
      CapacitorHttp = registerPlugin("CapacitorHttp", {
        web: () => new CapacitorHttpPluginWeb()
      });
      (function(SystemBarsStyle2) {
        SystemBarsStyle2["Dark"] = "DARK";
        SystemBarsStyle2["Light"] = "LIGHT";
        SystemBarsStyle2["Default"] = "DEFAULT";
      })(SystemBarsStyle || (SystemBarsStyle = {}));
      (function(SystemBarType2) {
        SystemBarType2["StatusBar"] = "StatusBar";
        SystemBarType2["NavigationBar"] = "NavigationBar";
      })(SystemBarType || (SystemBarType = {}));
      SystemBarsPluginWeb = class extends WebPlugin {
        async setStyle() {
          this.unavailable("not available for web");
        }
        async setAnimation() {
          this.unavailable("not available for web");
        }
        async show() {
          this.unavailable("not available for web");
        }
        async hide() {
          this.unavailable("not available for web");
        }
      };
      SystemBars = registerPlugin("SystemBars", {
        web: () => new SystemBarsPluginWeb()
      });
    }
  });

  // node_modules/@capacitor/haptics/dist/esm/definitions.js
  var ImpactStyle, NotificationType;
  var init_definitions = __esm({
    "node_modules/@capacitor/haptics/dist/esm/definitions.js"() {
      (function(ImpactStyle2) {
        ImpactStyle2["Heavy"] = "HEAVY";
        ImpactStyle2["Medium"] = "MEDIUM";
        ImpactStyle2["Light"] = "LIGHT";
      })(ImpactStyle || (ImpactStyle = {}));
      (function(NotificationType2) {
        NotificationType2["Success"] = "SUCCESS";
        NotificationType2["Warning"] = "WARNING";
        NotificationType2["Error"] = "ERROR";
      })(NotificationType || (NotificationType = {}));
    }
  });

  // node_modules/@capacitor/haptics/dist/esm/web.js
  var web_exports = {};
  __export(web_exports, {
    HapticsWeb: () => HapticsWeb
  });
  var HapticsWeb;
  var init_web = __esm({
    "node_modules/@capacitor/haptics/dist/esm/web.js"() {
      init_dist();
      init_definitions();
      HapticsWeb = class extends WebPlugin {
        constructor() {
          super(...arguments);
          this.selectionStarted = false;
        }
        async impact(options) {
          const pattern = this.patternForImpact(options === null || options === void 0 ? void 0 : options.style);
          this.vibrateWithPattern(pattern);
        }
        async notification(options) {
          const pattern = this.patternForNotification(options === null || options === void 0 ? void 0 : options.type);
          this.vibrateWithPattern(pattern);
        }
        async vibrate(options) {
          const duration = (options === null || options === void 0 ? void 0 : options.duration) || 300;
          this.vibrateWithPattern([duration]);
        }
        async selectionStart() {
          this.selectionStarted = true;
        }
        async selectionChanged() {
          if (this.selectionStarted) {
            this.vibrateWithPattern([70]);
          }
        }
        async selectionEnd() {
          this.selectionStarted = false;
        }
        patternForImpact(style = ImpactStyle.Heavy) {
          if (style === ImpactStyle.Medium) {
            return [43];
          } else if (style === ImpactStyle.Light) {
            return [20];
          }
          return [61];
        }
        patternForNotification(type = NotificationType.Success) {
          if (type === NotificationType.Warning) {
            return [30, 40, 30, 50, 60];
          } else if (type === NotificationType.Error) {
            return [27, 45, 50];
          }
          return [35, 65, 21];
        }
        vibrateWithPattern(pattern) {
          if (navigator.vibrate) {
            navigator.vibrate(pattern);
          } else {
            throw this.unavailable("Browser does not support the vibrate API");
          }
        }
      };
    }
  });

  // node_modules/@capacitor/share/dist/esm/web.js
  var web_exports2 = {};
  __export(web_exports2, {
    ShareWeb: () => ShareWeb
  });
  var ShareWeb;
  var init_web2 = __esm({
    "node_modules/@capacitor/share/dist/esm/web.js"() {
      init_dist();
      ShareWeb = class extends WebPlugin {
        async canShare() {
          if (typeof navigator === "undefined" || !navigator.share) {
            return { value: false };
          } else {
            return { value: true };
          }
        }
        async share(options) {
          if (typeof navigator === "undefined" || !navigator.share) {
            throw this.unavailable("Share API not available in this browser");
          }
          await navigator.share({
            title: options.title,
            text: options.text,
            url: options.url
          });
          return {};
        }
      };
    }
  });

  // apps/doppia-scelta/game.mjs
  var decks = {
    mix: "Tutto mescolato",
    amicizia: "Tra amici",
    caos: "Caos totale",
    avventura: "Avventura"
  };
  var scenarios = [
    { id: "treno", deck: "avventura", question: "Il treno si ferma per un\u2019ora. Che fai?", a: "Esplori il paese vicino", b: "Organizzi un torneo nel vagone" },
    { id: "festa", deck: "amicizia", question: "Hai una festa a sorpresa da organizzare.", a: "Inviti tutti all\u2019ultimo minuto", b: "Prepari una missione segreta" },
    { id: "isola", deck: "avventura", question: "Una settimana su un\u2019isola con gli amici.", a: "Porti giochi da tavolo", b: "Porti strumenti musicali" },
    { id: "cena", deck: "caos", question: "Il gruppo deve cucinare una cena.", a: "Ognuno inventa una portata", b: "Si cucina una ricetta impossibile" },
    { id: "viaggio", deck: "avventura", question: "Partite domani senza una meta fissata.", a: "Seguite il primo treno", b: "Lasciate decidere una moneta" },
    { id: "talento", deck: "caos", question: "Il gruppo partecipa a un talent show.", a: "Fate una coreografia", b: "Inventate uno spettacolo comico" },
    { id: "mistero", deck: "avventura", question: "Trovate una scatola chiusa in soffitta.", a: "La aprite subito", b: "Cercate prima indizi" },
    { id: "cinema", deck: "amicizia", question: "Una sera, un solo film per tutti.", a: "Il pi\xF9 amato dal gruppo", b: "Uno scelto a caso" },
    { id: "citta", deck: "caos", question: "Per un giorno guidate la vostra citt\xE0.", a: "Create una festa in ogni piazza", b: "Rendete gratis tutti i trasporti" },
    { id: "sfida", deck: "caos", question: "Vi sfidano a costruire qualcosa insieme.", a: "Una torre altissima", b: "Un labirinto gigantesco" },
    { id: "regalo", deck: "amicizia", question: "Un solo regalo da fare a un amico.", a: "Un\u2019esperienza da vivere", b: "Un oggetto fatto da voi" },
    { id: "tempo", deck: "amicizia", question: "Potete rivivere una giornata insieme.", a: "La pi\xF9 divertente", b: "Quella che cambiereste" },
    { id: "karaoke", deck: "amicizia", question: "Al karaoke resta una sola canzone.", a: "La cantate tutti insieme", b: "Scegliete il pi\xF9 coraggioso" },
    { id: "segreto", deck: "amicizia", question: "Il gruppo deve custodire un segreto buffo.", a: "Fate un patto solenne", b: "Inventate una parola in codice" },
    { id: "foto", deck: "amicizia", question: "Dovete scegliere la foto del gruppo.", a: "La pi\xF9 bella", b: "La pi\xF9 imbarazzante" },
    { id: "ritardo", deck: "amicizia", question: "Un amico arriva sempre in ritardo.", a: "Gli date un orario falso", b: "Lo aspettate con uno scherzo" },
    { id: "chat", deck: "amicizia", question: "La chat del gruppo cambia nome.", a: "Un ricordo che capite solo voi", b: "Una parola scelta a caso" },
    { id: "compleanno", deck: "amicizia", question: "Potete regalare una sola sorpresa.", a: "Un video di tutti gli amici", b: "Una giornata organizzata in segreto" },
    { id: "playlist", deck: "amicizia", question: "Create la playlist ufficiale del gruppo.", a: "Una canzone scelta da ciascuno", b: "Solo brani che fanno ballare" },
    { id: "promessa", deck: "amicizia", question: "Fate una promessa da mantenere per un mese.", a: "Vedervi ogni settimana", b: "Provare insieme qualcosa di nuovo" },
    { id: "mascotte", deck: "caos", question: "Il gruppo deve scegliere una mascotte.", a: "Un fenicottero gigante", b: "Una patata con gli occhiali" },
    { id: "superpotere", deck: "caos", question: "Avete un superpotere per ventiquattro ore.", a: "Fermare il tempo", b: "Leggere i pensieri" },
    { id: "invasione", deck: "caos", question: "Gli alieni chiedono il capo del gruppo.", a: "Mandate il pi\xF9 diplomatico", b: "Decidete con morra cinese" },
    { id: "silenzio", deck: "caos", question: "Sfida: un giorno intero senza parlare.", a: "Comunicate solo a gesti", b: "Usate cartelli assurdi" },
    { id: "uniforme", deck: "caos", question: "Dovete indossare tutti la stessa cosa.", a: "Un cappello enorme", b: "Un pigiama colorato" },
    { id: "ristorante", deck: "caos", question: "Aprite un ristorante per una sera.", a: "Men\xF9 con nomi misteriosi", b: "Piatti scelti con una ruota" },
    { id: "record", deck: "caos", question: "Provate a battere un record mondiale.", a: "La fila di domino pi\xF9 lunga", b: "Il ballo di gruppo pi\xF9 strano" },
    { id: "lotteria", deck: "caos", question: "Vincete una cifra enorme tutti insieme.", a: "Comprate un castello", b: "Partite senza dire dove" },
    { id: "bussola", deck: "avventura", question: "Nel bosco avete una mappa e una bussola.", a: "Seguite la mappa", b: "Seguite la bussola" },
    { id: "campeggio", deck: "avventura", question: "Al campeggio inizia un temporale.", a: "Restate in tenda a raccontare storie", b: "Correte al rifugio pi\xF9 vicino" },
    { id: "montagna", deck: "avventura", question: "In cima alla montagna trovate due sentieri.", a: "Quello corto e ripido", b: "Quello lungo e panoramico" },
    { id: "mappa", deck: "avventura", question: "Trovate una vecchia mappa del quartiere.", a: "Cercate subito il punto segnato", b: "Scoprite prima chi l\u2019ha disegnata" },
    { id: "barca", deck: "avventura", question: "Avete una piccola barca per un giorno.", a: "Cercate una spiaggia nascosta", b: "Seguite i delfini da lontano" },
    { id: "notte", deck: "avventura", question: "Una notte sotto le stelle.", a: "Dormite senza tenda", b: "Restate svegli fino all\u2019alba" },
    { id: "sentiero", deck: "avventura", question: "Un cartello indica un sentiero sconosciuto.", a: "Lo seguite tutti", b: "Chiedete prima informazioni" },
    { id: "passaporto", deck: "avventura", question: "Potete partire ora per una sola destinazione.", a: "Una citt\xE0 mai visitata", b: "Un luogo immerso nella natura" }
  ];
  var clean = (name) => name.trim().replace(/\s+/g, " ");
  function createGame(names, rounds = 6, startAt = 0, deck = "mix") {
    if (!Array.isArray(names)) throw new Error("Servono da 3 a 8 giocatori.");
    const players = names.map(clean);
    if (players.length < 3 || players.length > 8 || players.some((x) => !x || x.length > 24)) throw new Error("Inserisci da 3 a 8 nomi, massimo 24 caratteri.");
    if (new Set(players.map((x) => x.toLocaleLowerCase("it"))).size !== players.length) throw new Error("Ogni giocatore deve avere un nome diverso.");
    if (!Object.hasOwn(decks, deck)) throw new Error("Mazzo non valido.");
    if (!Number.isInteger(startAt) || startAt < 0 || startAt >= scenarios.length) throw new Error("Scenario iniziale non valido.");
    const pool = deck === "mix" ? scenarios : scenarios.filter((item) => item.deck === deck);
    if (!Number.isInteger(rounds) || rounds < 1 || rounds > pool.length) throw new Error("Numero di round non valido.");
    const requested = scenarios[startAt];
    const startIndex = Math.max(0, pool.findIndex((item) => item.id === requested.id));
    const scenarioIds = [...pool.slice(startIndex), ...pool.slice(0, startIndex)].map((item) => item.id);
    return { players, scores: Object.fromEntries(players.map((x) => [x, 0])), round: 0, rounds, deck, scenarioIds, votes: [], history: [] };
  }
  function currentScenario(game2) {
    const scenario = scenarios.find((item) => item.id === game2.scenarioIds[game2.round]);
    if (!scenario) throw new Error("Scenario non disponibile.");
    return scenario;
  }
  function vote(game2, choice) {
    if (!["a", "b"].includes(choice) || game2.round >= game2.rounds || game2.votes.length >= game2.players.length) throw new Error("Voto non valido.");
    return { ...game2, votes: [...game2.votes, { player: game2.players[game2.votes.length], choice }] };
  }
  function reveal(game2) {
    if (game2.votes.length !== game2.players.length) throw new Error("Non hanno votato tutti.");
    const a = game2.votes.filter((v) => v.choice === "a").length;
    const b = game2.votes.length - a;
    const scores = { ...game2.scores };
    for (const item of game2.votes) if (a === b || (item.choice === "a" ? a < b : b < a)) scores[item.player] += a === b ? 1 : 2;
    return { ...game2, scores, history: [...game2.history, { scenario: currentScenario(game2).id, a, b, votes: game2.votes }], round: game2.round + 1, votes: [] };
  }

  // apps/doppia-scelta/main.mjs
  init_dist();

  // node_modules/@capacitor/haptics/dist/esm/index.js
  init_dist();
  init_definitions();
  var Haptics = registerPlugin("Haptics", {
    web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.HapticsWeb())
  });

  // node_modules/@capacitor/share/dist/esm/index.js
  init_dist();
  var Share = registerPlugin("Share", {
    web: () => Promise.resolve().then(() => (init_web2(), web_exports2)).then((m) => new m.ShareWeb())
  });

  // apps/doppia-scelta/main.mjs
  var screen = document.querySelector("#screen");
  var game = null;
  var phase = "home";
  var lastResult = null;
  var challengedId = new URLSearchParams(location.search).get("sfida");
  var challengeIndex = scenarios.findIndex((item) => item.id === challengedId);
  var installButton = document.querySelector("#install");
  var installPrompt = null;
  var escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  var button = (label, action, extra = "") => `<button type="button" data-action="${action}" class="${extra}">${label}</button>`;
  var deckOptions = Object.entries(decks).map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  function render() {
    if (phase === "home") {
      screen.innerHTML = `<div class="intro"><p class="kicker">${challengeIndex >= 0 ? "Un altro gruppo vi ha sfidato." : "Una scelta. Due fazioni."}</p><h1>${challengeIndex >= 0 ? "Il vostro gruppo si divider\xE0?" : "Quanto conosci davvero il tuo gruppo?"}</h1><p>Su ogni dilemma votate in segreto. Se finisci in minoranza, guadagni punti. Se il gruppo si divide a met\xE0, vincono tutti.</p>${challengeIndex >= 0 ? `<p class="challenge">Prima domanda: ${escapeHtml(scenarios[challengeIndex].question)}</p>` : ""}<form id="setup"><label for="names">Nomi dei giocatori, separati da virgole</label><input id="names" name="names" autocomplete="off" placeholder="Anna, Luca, Sara, Marco" required><label for="deck">Mazzo</label><select id="deck" name="deck" ${challengeIndex >= 0 ? "disabled" : ""}>${challengeIndex >= 0 ? '<option value="mix">Sfida ricevuta</option>' : deckOptions}</select><p id="error" class="error" role="alert"></p><button class="primary" type="submit">Inizia la partita</button></form><div class="rule"><span class="rule-icon">A<span>/</span>B</span><p>Passate il telefono. Ognuno vede il dilemma e vota senza farsi vedere.</p></div></div>`;
      return;
    }
    if (phase === "pass") {
      const player = game.players[game.votes.length];
      screen.innerHTML = `<div class="panel pass"><p class="step">Round ${game.round + 1} di ${game.rounds}</p><h1>Passa il telefono a<br><em>${escapeHtml(player)}</em></h1><p>Chi ha gi\xE0 votato distoglie lo sguardo.</p>${button(`Sono ${escapeHtml(player)}`, "show", "primary")}</div>`;
      return;
    }
    if (phase === "choose") {
      const scenario = currentScenario(game);
      screen.innerHTML = `<div class="choose"><p class="step">${escapeHtml(decks[scenario.deck])} \xB7 ${escapeHtml(game.players[game.votes.length])}, scegli in segreto</p><h1>${escapeHtml(scenario.question)}</h1><div class="choices">${button(`<small>Scelta A</small>${escapeHtml(scenario.a)}`, "a", "choice a")}${button(`<small>Scelta B</small>${escapeHtml(scenario.b)}`, "b", "choice b")}</div><p class="hint">Vale 2 punti se sei in minoranza. In parit\xE0, 1 punto a tutti.</p></div>`;
      return;
    }
    if (phase === "result") {
      const done = game.round >= game.rounds;
      const ranking = Object.entries(game.scores).sort((a, b) => b[1] - a[1]);
      screen.innerHTML = `<div class="result"><p class="step">${done ? "Partita finita" : `Round ${game.round} completato`}</p><h1>${lastResult.a} contro ${lastResult.b}</h1><div class="score-split"><div class="a">A <strong>${lastResult.a}</strong></div><div class="b">B <strong>${lastResult.b}</strong></div></div><p class="explain">${lastResult.a === lastResult.b ? "Parit\xE0 perfetta: un punto per tutti." : "La minoranza prende due punti."}</p><h2>Classifica</h2><ol>${ranking.map(([name, score]) => `<li><span>${escapeHtml(name)}</span><strong>${score}</strong></li>`).join("")}</ol>${button("Sfida un altro gruppo", "share", "primary")}${done ? button("Nuova partita", "restart", "secondary") : button("Prossimo dilemma", "next", "secondary")}</div>`;
    }
  }
  screen.addEventListener("submit", (event) => {
    if (event.target.id !== "setup") return;
    event.preventDefault();
    try {
      const selectedDeck = challengeIndex >= 0 ? "mix" : event.target.elements.deck.value;
      const pool = selectedDeck === "mix" ? scenarios : scenarios.filter((item) => item.deck === selectedDeck);
      const selected = challengeIndex >= 0 ? scenarios[challengeIndex] : pool[Math.floor(Math.random() * pool.length)];
      game = createGame(event.target.elements.names.value.split(","), 6, scenarios.indexOf(selected), selectedDeck);
      phase = "pass";
      render();
    } catch (error) {
      document.querySelector("#error").textContent = error.message;
    }
  });
  screen.addEventListener("click", async (event) => {
    const actionButton = event.target.closest("button[data-action]");
    const action = actionButton?.dataset.action;
    if (!action) return;
    if (action === "show" && phase === "pass") phase = "choose";
    else if (["a", "b"].includes(action) && phase === "choose") {
      game = vote(game, action);
      if (game.votes.length === game.players.length) {
        game = reveal(game);
        lastResult = game.history.at(-1);
        phase = "result";
      } else phase = "pass";
    } else if (action === "next" && phase === "result") phase = "pass";
    else if (action === "restart" && phase === "result") {
      game = null;
      phase = "home";
    } else if (action === "share" && phase === "result") {
      const scenario = scenarios.find((item) => item.id === lastResult.scenario);
      const text = `Noi ci siamo divisi ${lastResult.a}-${lastResult.b} su: \u201C${scenario.question}\u201D E voi?`;
      const url = new URL(location.href);
      url.searchParams.set("sfida", scenario.id);
      if (Capacitor.isNativePlatform()) {
        try {
          await Share.share({ title: "Doppia Scelta", text, url: url.href, dialogTitle: "Sfida un altro gruppo" });
        } catch (error) {
          if (!String(error?.message).toLowerCase().includes("cancel")) actionButton.textContent = "Condivisione non riuscita";
        }
      } else if (navigator.share) {
        try {
          await navigator.share({ title: "Doppia Scelta", text, url: url.href });
        } catch (error) {
          if (error.name !== "AbortError") actionButton.textContent = "Condivisione non riuscita";
        }
      } else if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(`${text} ${url.href}`);
          actionButton.textContent = "Link copiato";
        } catch {
          actionButton.textContent = "Impossibile copiare il link";
        }
      } else actionButton.textContent = "Condivisione non disponibile";
      return;
    }
    if (["a", "b"].includes(action)) {
      if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
      });
      else if (navigator.vibrate) navigator.vibrate(18);
    }
    render();
  });
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });
  installButton.addEventListener("click", async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    installPrompt = null;
    installButton.hidden = true;
  });
  window.addEventListener("appinstalled", () => {
    installButton.hidden = true;
  });
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {
    }));
  }
  render();
})();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
