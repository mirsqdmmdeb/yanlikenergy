/* ============================================================
   YANLIK 5.0 • Core Module
   Message Model • Event Bus • Local Storage Layer
   ============================================================ */

(function(global){
  "use strict";

  const VERSION = "5.0-core";

  // ---- Event Bus ----
  class EventBus {
    constructor(){ this.events = {}; }
    on(evt, fn){
      if(!this.events[evt]) this.events[evt] = [];
      this.events[evt].push(fn);
    }
    off(evt, fn){
      if(!this.events[evt]) return;
      this.events[evt] = this.events[evt].filter(f => f !== fn);
    }
    emit(evt, data){
      if(!this.events[evt]) return;
      for(const fn of this.events[evt]) try{ fn(data); }catch(e){console.error(e);}
    }
  }

  // ---- Message Model ----
  class Message {
    constructor(role, text, meta={}){
      this.id = meta.id || "m"+Date.now()+"_"+Math.random().toString(36).slice(2,8);
      this.role = role;         // "user" | "assistant" | "system"
      this.text = text;
      this.time = meta.time || new Date().toISOString();
      this.lang = meta.lang || "auto";
      this.emotion = meta.emotion || null;
      this.final = !!meta.final;
    }
  }

  // ---- Conversation ----
  class Conversation {
    constructor(id){
      this.id = id || "c"+Date.now().toString(36);
      this.created = new Date().toISOString();
      this.messages = [];
      this.tags = [];
    }
    add(role,text,meta={}){
      const m = new Message(role,text,meta);
      this.messages.push(m);
      YanlikBus.emit("message:new",{conv:this,m});
      return m;
    }
    get last(){ return this.messages[this.messages.length-1]; }
    toJSON(){ return {id:this.id,created:this.created,messages:this.messages,tags:this.tags}; }
  }

  // ---- Storage Layer ----
  const Storage = {
    prefix:"yanlik.convo.",
    list(){
      return Object.keys(localStorage)
        .filter(k=>k.startsWith(this.prefix))
        .map(k=>k.replace(this.prefix,""));
    },
    save(conv){
      localStorage.setItem(this.prefix+conv.id, JSON.stringify(conv));
    },
    load(id){
      const raw = localStorage.getItem(this.prefix+id);
      if(!raw) return null;
      const obj = JSON.parse(raw);
      const c = new Conversation(obj.id);
      c.created=obj.created; c.tags=obj.tags||[];
      c.messages=obj.messages||[];
      return c;
    },
    remove(id){ localStorage.removeItem(this.prefix+id); }
  };

  // ---- Message Queue ----
  class MsgQueue {
    constructor(){
      this.queue = [];
      this.running = false;
    }
    push(task){
      this.queue.push(task);
      if(!this.running) this.run();
    }
    async run(){
      this.running = true;
      while(this.queue.length>0){
        const task = this.queue.shift();
        try{ await task(); }
        catch(e){ console.error(e); }
      }
      this.running = false;
    }
  }

  // ---- Core Engine ----
  class YanlikCore {
    constructor(){
      this.bus = YanlikBus;
      this.queue = new MsgQueue();
      this.current = null;
    }

    createConversation(){
      this.current = new Conversation();
      Storage.save(this.current);
      this.bus.emit("conversation:new", this.current);
      return this.current;
    }

    getConversation(id){
      if(id) this.current = Storage.load(id);
      if(!this.current) this.current = this.createConversation();
      return this.current;
    }

    addMessage(role,text,meta={}){
      const c = this.getConversation(this.current?.id);
      const m = c.add(role,text,meta);
      Storage.save(c);
      return m;
    }

    userSend(text){
      const msg = this.addMessage("user", text);
      this.bus.emit("user:send", msg);
    }

    assistantReply(text,meta={}){
      const msg = this.addMessage("assistant", text, {...meta,final:true});
      this.bus.emit("assistant:reply", msg);
    }

    clear(){
      if(this.current) Storage.remove(this.current.id);
      this.current = null;
      this.bus.emit("conversation:clear");
    }
  }

  // ---- Instantiate global objects ----
  const YanlikBus = new EventBus();
  const Core = new YanlikCore();

  // Expose globally
  global.YanlikCore = Core;
  global.YanlikBus = YanlikBus;
  global.YanlikStorage = Storage;
  global.YanlikConversation = Conversation;
  global.YanlikMessage = Message;

  console.log("Yanlik Core loaded:", VERSION);

})(window);