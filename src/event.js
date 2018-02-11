// Add events to elements
;[  'click'
  , 'dblclick'
  , 'mousedown'
  , 'mouseup'
  , 'mouseover'
  , 'mouseout'
  , 'mousemove'
  , 'mouseenter'
  , 'mouseleave'
  , 'touchstart'
  , 'touchmove'
  , 'touchleave'
  , 'touchend'
  , 'touchcancel' ].forEach(function(event) {

  // add event to SVG.Element
  SVG.Element.prototype[event] = function(f) {
    // bind event to element rather than element node
    SVG.on(this, event, f)
    return this
  }
})

SVG.listenerId = 0

// Add event binder in the SVG namespace
SVG.on = function(node, events, listener, binding, options) {
  var l = listener.bind(binding || node)
    , n = node instanceof SVG.Element ? node.node : node

  // ensure instance object for nodes which are not adopted
  n.instance = n.instance || {events:{}}

  var bag = n.instance.events

  // ensure valid object
  bag[ev]     = bag[ev]     || {}
  bag[ev][ns] = bag[ev][ns] || {}

  // add id to listener
  if(!listener._svgjsListenerId)
    listener._svgjsListenerId = ++SVG.listenerId

  events.split(SVG.regex.delimiter).forEach(function(event) {
    var ev = event.split('.')[0]
      , ns = event.split('.')[1] || '*'

    // reference listener
    bag[ev][ns][listener._svgjsListenerId] = l

    // add listener
    n.addEventListener(ev, l, options || false)
  })
}

// Add event unbinder in the SVG namespace
SVG.off = function(node, events, listener, options) {
  var n = node instanceof SVG.Element ? node.node : node
  if(!n.instance) return

  // make a precheck for a valid listener here to avoid repetition in the loop
  if (listener) {
    if(typeof listener == 'function') listener = listener._svgjsListenerId
    if(!listener) return
  }

  var bag = n.instance.events

  ;(events || '').split(SVG.regex.delimiter).forEach(function(event) {
    var ev = event && event.split('.')[0]
      , ns = event && event.split('.')[1]
      , namespace

    if (listener) {
      // remove listener reference
      if (bag[ev] && bag[ev][ns || '*']) {
        // remove listener
        n.removeEventListener(ev, bag[ev][ns || '*'][listener], options || false)

        delete bag[ev][ns || '*'][listener]
      }
    } else if (ev && ns) {
      // remove all listeners for a namespaced event
      if (bag[ev] && bag[ev][ns]) {
        for (listener in bag[ev][ns])
          SVG.off(n, [ev, ns].join('.'), listener)

        delete bag[ev][ns]
      }
    } else if (ns){
      // remove all listeners for a specific namespace
      for(event in bag)
        for(namespace in bag[event])
          if(ns === namespace)
            SVG.off(n, [event, ns].join('.'))
    } else if (ev) {
      // remove all listeners for the event
      if (bag[ev]) {
        for (namespace in bag[ev])
          SVG.off(n, [ev, namespace].join('.'))

        delete bag[ev]
      }
    } else {
      // remove all listeners on a given node
      for (event in bag)
        SVG.off(n, event)

      n.instance.events = {}
    }
  })
}


SVG.extend(SVG.Element, {
  // Bind given event to listener
  on: function(event, listener, binding, options) {
    SVG.on(this, event, listener, binding, options)

    return this
  }
  // Unbind event from listener
, off: function(event, listener) {
    SVG.off(this.node, event, listener)

    return this
  }
, dispatch: function(event, data) {
    // Dispatch event
    if(event instanceof window.Event){
      this.node.dispatchEvent(event)
    }else{
      this.node.dispatchEvent(event = new window.CustomEvent(event, {detail:data, cancelable: true}))
    }
    return event
  }
  // Fire given event
, fire: function(event, data) {
    this.dispatch(event, data)
    return this
  }
})
