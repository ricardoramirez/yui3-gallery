

	/**
	 * @class Sidepicker
	 * Sidepicker component. This is meant to be instantiated, so it is provided as a
	 * function-constructor and is later extended with the additional functions.
	 * The user will most likely call:
	 *		new Y.Sidepicker(), to create a new component
	 * 
	 * @param {String|DomElement} domElement	The domElement to use as existing markup
	 */
	Y.Sidepicker = function (sourceNode) {
		if (typeof(sourceNode) === 'string') {
			sourceNode = Y.DOM.byId(sourceNode);
		}
	    this.sourceNode = Y.get(sourceNode);
		if (!this.sourceNode) {
			Y.log('"' + sourceNode + '" could not be found, the sidepicker requires existing markup');
			return;
		}
	    this.initializePicker();
	}; 

	/**
	 * Prototype definition for the sidepicker
	 */
	Y.Sidepicker.prototype = {
	
		/**
		 * Initializes the picker. This method initializes all the elements of the picker
		 * as clickable, and sets the events on them for the selection
		 */
		initializePicker: function() {
			this.sourceNode.addClass('sidepicker');
			
			var tabs = this.sourceNode.all('li');

			// store a reference to the content inside the tabs
			tabs.each(function(ele) {
				var anchor = ele.one('a');
				if (anchor) {
					var content = Y.one(anchor.getAttribute('href'));
					if (content) {
						ele.setData('content', content);
						content.remove();
					}
					ele.set('innerHTML', anchor.get('innerHTML'));
				}
			}, this);

			// register the events, to expadn whenever we click on the tab
			tabs.on('click', function(ev) {
				this.expand(ev.currentTarget);
			}, this);
			
			tabs.addClass('rightBorder');
		},
		
		/**
		 * Expand the panel from the element that was clicked. This gives the effect of the panel
		 * getting out, and then expanded to cover the screen with any information
		 */
		expand: function(ele) {
			if (this.eventRunning) {
				return;
			}
			this.eventRunning = true;

			// if there is a previous target setup, close		
			if (this.previousTarget !== undefined) {
				var thisObj = this;
				this.close(this.previousTarget, 
					ele != this.previousTarget ? function() { thisObj.expand(ele); } : null
					);
				return;
			}
		
			// selections
			this.previousTarget = ele;
			this.selection = Y.Node.create('<div class="selection">&nbsp;</div>');
			ele.prepend(this.selection);
			this.selectionInside = Y.Node.create('<div class="selectionInside">&nbsp;</div>');
			ele.prepend(this.selectionInside);
			
			// create the slider
			this.slider = Y.Node.create('<div class="slider">&nbsp;</div>');
			this.slider.setStyle('top', ele.getY());
			this.slider.setStyle('left', ele.getX());
			Y.one(document.body).prepend(this.slider);
			
			// add the content
			var content = ele.getData('content');
			if (content)
			{
				this.slider.append(content);
			}			
			
			// remove the border
			ele.removeClass('rightBorder');
		
			// actions to do when the animation ends
			function endAnimation() {
				this.eventRunning = false;
				ele.addClass('liExpanded');
			}
		
			// animate
			function animateHeight() {
				var pickerRegion = this.sourceNode.get('region');
				var targetHeight = pickerRegion.height - 3 - 10;	// 3 for adjusting, 10 for padding
				var vAnimation = new Y.Anim({
					node: this.slider,
					to: { xy: [ this.slider.get('left'), pickerRegion.top ], height: targetHeight }
					});
				vAnimation.set('duration', 1);
				vAnimation.set('easing', Y.Easing.easeOut);
				vAnimation.on('end', endAnimation, this);
				vAnimation.run();
			}
		
			var targetWidth = Y.DOM.winWidth() - 120;
			var hAnimation = new Y.Anim({
				node: this.slider,
				to: { width: targetWidth }
				});
			hAnimation.set('duration', 1);
			hAnimation.set('easing', Y.Easing.easeOut);
			hAnimation.on('end', animateHeight, this);
			hAnimation.run();
		},
		
		/**
		 * This method should only be called if we previously had an expanded node. It will collapse the node back,
		 * animating it in the process
		 */
		close: function(ele, callback) {
			// remove the slider and the selector used for the content			
			function removeElements() {
				ele.addClass('rightBorder');
				
				this.selection.remove();
				this.selectionInside.remove();
				this.slider.remove();
				delete this.selection;
				delete this.selectionInside;
				delete this.slider;
				delete this.previousTarget;
				
				var content = ele.getData('content');
				if (content)
				{
					content.remove();
				}				
				
				this.eventRunning = false;	// expire the event
				if (callback)
				{
					callback();
				}
			}
			
			// horizontal animation
			function animateWidth() {
				var hAnimation = new Y.Anim({
					node: this.slider,
					to: { width: 0 }
					});
				hAnimation.set('duration', 0.5);
				hAnimation.set('easing', Y.Easing.easeOut);
				hAnimation.on('end', removeElements, this);
				hAnimation.run();			
			}
			
			// vertical animation
			var liRegion = ele.get('region');
			var vAnimation = new Y.Anim({
				node: this.slider,
				to: { xy: [ this.slider.get('left'), liRegion.top ], height: liRegion.height - 2 - 10 }
				});
			vAnimation.set('duration', 0.5);
			vAnimation.set('easing', Y.Easing.easeOut);
			vAnimation.on('end', animateWidth, this);
			vAnimation.run();
		}
		
	};
	
