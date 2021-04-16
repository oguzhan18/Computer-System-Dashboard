GaugeSVG = function(params)
{ 
	if (!params.id)
	{
		alert ("Missing parameter 'params.id' for GaugeSVG.");
		return undefined;
	}
	var container = document.getElementById(params.id);
	if (container == null || container == undefined)
	{
		alert ("Can not find DOM element with ID '" + params.id + "'.");
		return undefined;
	}
	if (container.tagName != "DIV")
	{
		alert ("DOM element with ID '" + params.id + "' must be of type 'DIV' but is of type '" + container.tagName + "'.");
		return undefined;
	}
	var precalculatedMin = (params.min) ? params.min * 1.0 : 0.0;
	var precalculatedMax = (params.max) ? params.max * 1.0 : 100.0;
	if (precalculatedMin > precalculatedMax)
	{
		var buffer = precalculatedMin;
		precalculatedMin = precalculatedMax;
		precalculatedMax = buffer;
	}
	this.config = {
		id: params.id,
		title: (params.title != undefined) ? params.title : "",
		titleColor: (params.titleColor != undefined) ? params.titleColor : "#888888",
		originalValue: (params.value) ? params.value : (precalculatedMax - precalculatedMin) / 2.0,
		value: (params.value) ? params.value : (precalculatedMax - precalculatedMin) / 2.0,
		valueColor: (params.valueColor != undefined) ? params.valueColor : "#000000",
		label: (params.label != undefined) ? params.label : "",
		labelColor: (params.labelColor != undefined) ? params.labelColor : "#888888",
		min: precalculatedMin,
		max: precalculatedMax,
		showMinMax: (params.showMinMax != undefined) ? params.showMinMax : true,
		minmaxColor: (params.minmaxColor != undefined) ? params.minmaxColor : "#888888",
		canvasBackColor: (params.canvasBackColor != undefined) ? params.canvasBackColor : "#f8f8f8",
		gaugeWidthScale: (params.gaugeWidthScale != undefined) ? params.gaugeWidthScale : 1.0,
		gaugeBorderColor: (params.gaugeBorderColor != undefined) ? params.gaugeBorderColor : "#cccccc",
		gaugeBorderWidth: (params.gaugeBorderWidth != undefined) ? params.gaugeBorderWidth : 0,
		gaugeBackColor: (params.gaugeBackColor != undefined) ? params.gaugeBackColor : "#cccccc",
		showGaugeShadow: (params.showGaugeShadow != undefined) ? params.showGaugeShadow : true,
		gaugeShadowColor: (params.gaugeShadowColor != undefined) ? params.gaugeShadowColor : "#000000",
		gaugeShadowScale: (params.gaugeShadowScale != undefined) ? params.gaugeShadowScale : 1.0,
		canvasW: container.style.pixelWidth  || container.offsetWidth,
		canvasH: container.style.pixelHeight || container.offsetHeight,
		offsetX: 0,
		offsetY: 0,
		lowerActionLimit: (params.lowerActionLimit != undefined) ? params.lowerActionLimit : (precalculatedMax - precalculatedMin) * 0.15 + precalculatedMin,
		lowerWarningLimit: (params.lowerWarningLimit != undefined) ? params.lowerWarningLimit : (precalculatedMax - precalculatedMin) * 0.30 + precalculatedMin,
		upperWarningLimit: (params.upperWarningLimit != undefined) ? params.upperWarningLimit : (precalculatedMax - precalculatedMin) * 0.70 + precalculatedMin,
		upperActionLimit: (params.upperActionLimit != undefined) ? params.upperActionLimit : (precalculatedMax - precalculatedMin) * 0.85 + precalculatedMin,
		needleColor: (params.needleColor != undefined) ? params.needleColor : "#444444",
		optimumRangeColor: (params.optimumRangeColor != undefined) ? params.optimumRangeColor : "#44ff44",
		warningRangeColor: (params.warningRangeColor != undefined) ? params.warningRangeColor : "#ffff00",
		actionRangeColor: (params.actionRangeColor != undefined) ? params.actionRangeColor : "#ff4444",
	};
	this.animation = {
		startIncrementDivisor: 24.0,
		maxIncrements: 48,
		decreaseOfIncrementValue: 0.966,
		delay: 15,
	}
	if (this.config.value > this.config.max)
		this.config.value = this.config.max; 
	if (this.config.value < this.config.min)
		this.config.value = this.config.min;

	// Determine container geometry.
	var svgns   = "http://www.w3.org/2000/svg";
	var widgetW = ((this.config.canvasW / this.config.canvasH) > 1.25 ? 1.25 * this.config.canvasH : this.config.canvasW);
	var widgetH = ((this.config.canvasW / this.config.canvasH) > 1.25 ? this.config.canvasH : this.config.canvasW / 1.25);
	this.config.offsetX = (this.config.canvasW - widgetW) / 2;
	this.config.offsetY = (this.config.canvasH - widgetH) / 2;
	this.canvas  = document.createElementNS(svgns, "svg");
	this.canvas.setAttributeNS(null, 'version', "1.1");
	this.canvas.setAttributeNS(null, 'width', "100%");
	this.canvas.setAttributeNS(null, 'height', "100%");
	this.canvas.setAttributeNS(null, 'style', "overflow: hidden; position: relative; left: -0.5px; top: -0.5px;");
	if (this.canvas == null || this.canvas == undefined)
	{
		alert ("Dom nesnelerinden biri çalışmıyor lütfen HTML dosyası ile oynamayınız. '" + this.config.id + "'.");
		return;
	}
	container.appendChild(this.canvas);
	this.calculateArcPath = function (valueStart, valueEnd, valueMin, valueMax, widgetWidth, widgetHeight, widgetOffsetX, widgetOffsetY, gaugeWidthScale)
	{
		var alpha = (1 - (valueStart - valueMin) / (valueMax - valueMin)) * Math.PI;
		var beta  = (1 - (valueEnd - valueMin) / (valueMax - valueMin)) * Math.PI;
		var radiusOutside = widgetWidth / 2 - widgetWidth / 20;
		var radiusInside  = radiusOutside - widgetWidth / 6.666666666666667 * gaugeWidthScale;
		var centerX   = widgetWidth / 2 + widgetOffsetX;
		var centerY   = widgetHeight / 1.15 + widgetOffsetY;
		var x1Outside = widgetWidth / 2 + widgetOffsetX + radiusOutside * Math.cos(alpha);
		var y1Outside = widgetHeight - (widgetHeight - centerY) + widgetOffsetY - radiusOutside * Math.sin(alpha);
		var x1Inside  = widgetWidth / 2 + widgetOffsetX + radiusInside * Math.cos(alpha);
		var y1Inside  = widgetHeight - (widgetHeight - centerY) + widgetOffsetY - radiusInside * Math.sin(alpha);
		var x2Outside = widgetWidth / 2 + widgetOffsetX + radiusOutside * Math.cos(beta);
		var y2Outside = widgetHeight - (widgetHeight - centerY) + widgetOffsetY - radiusOutside * Math.sin(beta);
		var x2Inside  = widgetWidth / 2 + widgetOffsetX + radiusInside * Math.cos(beta);
		var y2Inside  = widgetHeight - (widgetHeight - centerY) + widgetOffsetY - radiusInside * Math.sin(beta);
		var path      = "";
		path += "M" + x1Inside + "," + y1Inside + " ";
		path += "L" + x1Outside + "," + y1Outside + " ";
		path += "A" + radiusOutside + "," + radiusOutside + " 0 0,1 " + x2Outside + "," + y2Outside + " ";
		path += "L" + x2Inside + "," + y2Inside + " ";
		path += "A" + radiusInside + "," + radiusInside + " 0 0,0 " + x1Inside + "," + y1Inside + " ";
		path += "z ";
		return path;
	};
	this.calculateArcGradient = function (widgetWidth, widgetHeight, widgetOffsetX, widgetOffsetY, gaugeWidthScale)
	{
		var radiusOutside = widgetWidth / 2 - widgetWidth / 20;
		
		var centerX   = widgetWidth / 2 + widgetOffsetX;
		var centerY   = widgetHeight / 1.15 + widgetOffsetY;
	}
	this.calculateNeedlePath = function (value, valueMin, valueMax, widgetWidth, widgetHeight, widgetOffsetX, widgetOffsetY, gaugeWidthScale)
	{
		var alpha   = (1.028 - (value - valueMin) / (valueMax - valueMin)) * Math.PI;
		var beta    = (1.01 - (value - valueMin) / (valueMax - valueMin)) * Math.PI;
		var gamma   = (1.00 - (value - valueMin) / (valueMax - valueMin)) * Math.PI;
		var delta   = (0.99 - (value - valueMin) / (valueMax - valueMin)) * Math.PI;
		var epsilon = (0.982 - (value - valueMin) / (valueMax - valueMin)) * Math.PI;
		var radiusPeak    = widgetWidth / 2 - widgetWidth / 50;
		var radiusOutside = widgetWidth / 2 - widgetWidth / 16;
		var radiusInside  = (widgetWidth / 2 - widgetWidth / 20) - widgetWidth / 6.666666666666667 * gaugeWidthScale;
		var centerX = widgetWidth / 2 + widgetOffsetX;
		var centerY = widgetHeight / 1.15 + widgetOffsetY;
		var x1Inside  = widgetWidth / 2 + widgetOffsetX + radiusInside * Math.cos(alpha);
		var y1Inside  = widgetHeight - (widgetHeight - centerY) + widgetOffsetY - radiusInside * Math.sin(alpha);
		var x1Outside = widgetWidth / 2 + widgetOffsetX + radiusOutside * Math.cos(beta);
		var y1Outside = widgetHeight - (widgetHeight - centerY) + widgetOffsetY - radiusOutside * Math.sin(beta);
		var xPeak     = widgetWidth / 2 + widgetOffsetX + radiusPeak * Math.cos(gamma);
		var yPeak     = widgetHeight - (widgetHeight - centerY) + widgetOffsetY - radiusPeak * Math.sin(gamma);
		var x2Outside = widgetWidth / 2 + widgetOffsetX + radiusOutside * Math.cos(delta);
		var y2Outside = widgetHeight - (widgetHeight - centerY) + widgetOffsetY - radiusOutside * Math.sin(delta);
		var x2Inside  = widgetWidth / 2 + widgetOffsetX + radiusInside * Math.cos(epsilon);
		var y2Inside  = widgetHeight - (widgetHeight - centerY) + widgetOffsetY - radiusInside * Math.sin(epsilon);
		var path      = "";
		path += "M" + x1Inside + "," + y1Inside + " ";
		path += "L" + x1Outside + "," + y1Outside + " ";
		path += "L" + xPeak + "," + yPeak + " ";
		path += "L" + x2Outside + "," + y2Outside + " ";
		path += "L" + x2Inside + "," + y2Inside + " ";
		path += "A" + radiusInside + "," + radiusInside + " 0 0,0 " + x1Inside + "," + y1Inside + " ";
		path += "z ";
		return path;
	};
if (this.config.showGaugeShadow == true)
{
	this.gradients = document.createElementNS(svgns, 'defs');
	this.gradients.setAttributeNS(null, 'id', "gradients");
	this.gradient = document.createElementNS(svgns, 'radialGradient');
	this.gradients.appendChild(this.gradient);
	this.gradient.setAttributeNS(null, 'id', this.config.id + "_gradient");
	this.gradient.setAttributeNS(null, 'cx', "50%");
	this.gradient.setAttributeNS(null, 'cy', "50%");
	this.gradient.setAttributeNS(null, 'r',  "100%");
	this.gradient.setAttributeNS(null, 'fx', "50%");
	this.gradient.setAttributeNS(null, 'fy', "50%");
	this.gradient.setAttributeNS(null, 'gradientTransform', "scale(1 2)");
	this.grad1sub1 = document.createElementNS(svgns, 'stop');
	this.gradient.appendChild(this.grad1sub1);
	this.grad1sub1.setAttributeNS(null, 'offset', "15%");
	this.grad1sub1.setAttributeNS(null, 'style', "stop-color:" + this.config.gaugeShadowColor + ";stop-opacity:1");
	this.grad1sub2 = document.createElementNS(svgns, 'stop');
	this.gradient.appendChild(this.grad1sub2);
	this.grad1sub2.setAttributeNS(null, 'offset', this.config.gaugeShadowScale * 33 + "%");
	this.grad1sub2.setAttributeNS(null, 'style', "stop-color:" + this.config.gaugeBackColor + ";stop-opacity:1");
	this.canvas.appendChild(this.gradients);
}
	this.rectBG = document.createElementNS(svgns, 'rect');
	this.rectBG.setAttributeNS(null, 'stroke', "none");
	this.rectBG.setAttributeNS(null, 'fill',   this.config.canvasBackColor);
	this.rectBG.setAttributeNS(null, 'x',      this.config.offsetX);
	this.rectBG.setAttributeNS(null, 'y',      this.config.offsetY);
	this.rectBG.setAttributeNS(null, 'width',  this.config.canvasW);
	this.rectBG.setAttributeNS(null, 'height', this.config.canvasH);
	this.canvas.appendChild(this.rectBG);
	this.gaugeBG = document.createElementNS(svgns, 'path');
	this.gaugeBG.setAttributeNS(null, 'stroke', this.config.gaugeBorderColor);
	this.gaugeBG.setAttributeNS(null, 'stroke-width', this.config.gaugeBorderWidth);
	if (this.config.showGaugeShadow == true)
	{
		this.gaugeBG.setAttributeNS(null, 'fill',   "url(#" + this.config.id + "_gradient)");
	}
	else
	{
		this.gaugeBG.setAttributeNS(null, 'fill',   this.config.gaugeBackColor);
	}
	this.gaugeBG.setAttributeNS(null, 'd',      this.calculateArcPath(this.config.min, this.config.max, this.config.min, this.config.max,
																	  this.config.canvasW, this.config.canvasH,
																	  this.config.offsetX, this.config.offsetY, this.config.gaugeWidthScale + 0.45));
																	  this.canvas.appendChild(this.gaugeBG);
	if (this.config.lowerActionLimit > this.config.min && this.config.lowerActionLimit < this.config.max)
	{
		this.gaugeLAR = document.createElementNS(svgns, 'path');
		this.gaugeLAR.setAttributeNS(null, 'stroke', "none");
		this.gaugeLAR.setAttributeNS(null, 'fill',   this.config.actionRangeColor);
		this.gaugeLAR.setAttributeNS(null, 'd',      this.calculateArcPath(this.config.min, this.config.lowerActionLimit, this.config.min, this.config.max,
																		   this.config.canvasW, this.config.canvasH,
																		   this.config.offsetX, this.config.offsetY, this.config.gaugeWidthScale));
		this.canvas.appendChild(this.gaugeLAR);
	}
	if (this.config.lowerWarningLimit > this.config.min && this.config.lowerWarningLimit < this.config.max)
	{
		var lowerWarningStart = (this.config.lowerActionLimit >= 0.0) ? this.config.lowerActionLimit : this.config.min;
		this.gaugeLWR = document.createElementNS(svgns, 'path');
		this.gaugeLWR.setAttributeNS(null, 'stroke', "none");
		this.gaugeLWR.setAttributeNS(null, 'fill',   this.config.warningRangeColor);
		this.gaugeLWR.setAttributeNS(null, 'd',      this.calculateArcPath(lowerWarningStart, this.config.lowerWarningLimit, this.config.min, this.config.max,
																		   this.config.canvasW, this.config.canvasH,
																		   this.config.offsetX, this.config.offsetY, this.config.gaugeWidthScale));
		this.canvas.appendChild(this.gaugeLWR);
	}
	if (this.config.lowerActionLimit > this.config.min && this.config.lowerActionLimit < this.config.max &&
        this.config.lowerWarningLimit > this.config.min && this.config.lowerWarningLimit < this.config.max)
	{
		this.gaugeOPT = document.createElementNS(svgns, 'path');
		this.gaugeOPT.setAttributeNS(null, 'stroke', "none");
		this.gaugeOPT.setAttributeNS(null, 'fill',   this.config.optimumRangeColor);
		this.gaugeOPT.setAttributeNS(null, 'd',      this.calculateArcPath(this.config.lowerWarningLimit, this.config.upperWarningLimit, this.config.min, this.config.max,
																		   this.config.canvasW, this.config.canvasH,
																		   this.config.offsetX, this.config.offsetY, this.config.gaugeWidthScale));
		this.canvas.appendChild(this.gaugeOPT);
	}
	if (this.config.upperWarningLimit > this.config.min && this.config.upperWarningLimit < this.config.max)
	{
		var upperWarningEnd = (this.config.upperActionLimit >= 0.0) ? this.config.upperActionLimit : this.config.max;
		this.gaugeUWR = document.createElementNS(svgns, 'path');
		this.gaugeUWR.setAttributeNS(null, 'stroke', "none");
		this.gaugeUWR.setAttributeNS(null, 'fill',   this.config.warningRangeColor);
		this.gaugeUWR.setAttributeNS(null, 'd',      this.calculateArcPath(this.config.upperWarningLimit, upperWarningEnd, this.config.min, this.config.max,
																		   this.config.canvasW, this.config.canvasH,
																		   this.config.offsetX, this.config.offsetY, this.config.gaugeWidthScale));
		this.canvas.appendChild(this.gaugeUWR);
	}
	if (this.config.upperActionLimit > this.config.min && this.config.upperActionLimit < this.config.max)
	{
		this.gaugeUAR = document.createElementNS(svgns, 'path');
		this.gaugeUAR.setAttributeNS(null, 'stroke', "none");
		this.gaugeUAR.setAttributeNS(null, 'fill',   this.config.actionRangeColor);
		this.gaugeUAR.setAttributeNS(null, 'd',      this.calculateArcPath(this.config.upperActionLimit, this.config.max, this.config.min, this.config.max,
																		   this.config.canvasW, this.config.canvasH,
																		   this.config.offsetX, this.config.offsetY, this.config.gaugeWidthScale));
		this.canvas.appendChild(this.gaugeUAR);
	}
	this.gaugeNDL = document.createElementNS(svgns, 'path');
	this.gaugeNDL.setAttributeNS(null, 'stroke', "none");
	this.gaugeNDL.setAttributeNS(null, 'fill',   this.config.needleColor);
	this.gaugeNDL.setAttributeNS(null, 'd',      this.calculateNeedlePath(this.config.value, this.config.min, this.config.max,
																		  this.config.canvasW, this.config.canvasH,
																		  this.config.offsetX, this.config.offsetY, this.config.gaugeWidthScale + 0.49));
	this.canvas.appendChild(this.gaugeNDL);
	if (this.config.title && this.config.title != "")
	{
		this.gaugeTIT = document.createElementNS(svgns, 'text');
		this.gaugeTIT.setAttributeNS(null, 'x',      this.config.offsetX + this.config.canvasW / 2.0);
		this.gaugeTIT.setAttributeNS(null, 'y',      this.config.offsetY + this.config.canvasH / 5.0);
		this.gaugeTIT.setAttributeNS(null, 'style',  "font-family:Arial,Verdana; font-size:" + Math.floor(this.config.canvasW / 11) + "px; font-weight:bold; fill-opacity:1.0; fill:" + this.config.titleColor + "; text-anchor:middle;");
		this.gaugeTIT.appendChild(document.createTextNode(this.config.title));
		this.canvas.appendChild(this.gaugeTIT);
	}
	if (this.config.label && this.config.label != "")
	{
		this.gaugeLBL = document.createElementNS(svgns, 'text');
		this.gaugeLBL.setAttributeNS(null, 'x',      this.config.offsetX + this.config.canvasW / 2.0);
		this.gaugeLBL.setAttributeNS(null, 'y',      this.config.offsetY + this.config.canvasH / 1.04);
		this.gaugeLBL.setAttributeNS(null, 'style',  "font-family:Arial,Verdana; font-size:" + Math.floor(this.config.canvasW / 16) + "px; font-weight:normal; fill-opacity:1.0; fill:" + this.config.labelColor + "; text-anchor:middle;");
		this.gaugeLBL.appendChild(document.createTextNode(this.config.label));
		this.canvas.appendChild(this.gaugeLBL);
	}
	this.gaugeVAL = document.createElementNS(svgns, 'text');
	this.gaugeVAL.setAttributeNS(null, 'x',      this.config.offsetX + this.config.canvasW / 2.0);
	this.gaugeVAL.setAttributeNS(null, 'y',      this.config.offsetY + this.config.canvasH / 1.2);
	this.gaugeVAL.setAttributeNS(null, 'style',  "font-family:Arial,Verdana; font-size:" + Math.floor(this.config.canvasW / 8) + "px; font-weight:bold; fill-opacity:1.0; fill:" + this.config.valueColor + "; text-anchor:middle;");
	this.gaugeVAL.appendChild(document.createTextNode(this.config.originalValue));
	this.canvas.appendChild(this.gaugeVAL);
	if (this.config.showMinMax == true)
	{
		this.gaugeMAX = document.createElementNS(svgns, 'text');
		this.gaugeMAX.setAttributeNS(null, 'x',      this.config.offsetX + this.config.canvasW / 20 + this.config.canvasW / 6.666666666666667 * this.config.gaugeWidthScale / 2);
		this.gaugeMAX.setAttributeNS(null, 'y',      this.config.offsetY + this.config.canvasH / 1.04);
		this.gaugeMAX.setAttributeNS(null, 'style',  "font-family:Arial,Verdana; font-size:" + Math.floor(this.config.canvasW / 16) + "px; font-weight:normal; fill-opacity:1.0; fill:" + this.config.minmaxColor + "; text-anchor:middle;");
		this.gaugeMAX.appendChild(document.createTextNode(this.config.min));
		this.canvas.appendChild(this.gaugeMAX);
	}
	if (this.config.showMinMax == true)
	{
		this.gaugeMIN = document.createElementNS(svgns, 'text');
		this.gaugeMIN.setAttributeNS(null, 'x',      this.config.offsetX + this.config.canvasW - (this.config.canvasW / 20 + this.config.canvasW / 6.666666666666667 * this.config.gaugeWidthScale / 2));
		this.gaugeMIN.setAttributeNS(null, 'y',      this.config.offsetY + this.config.canvasH / 1.04);
		this.gaugeMIN.setAttributeNS(null, 'style',  "font-family:Arial,Verdana; font-size:" + Math.floor(this.config.canvasW / 16) + "px; font-weight:normal; fill-opacity:1.0; fill:" + this.config.minmaxColor + "; text-anchor:middle;");
		this.gaugeMIN.appendChild(document.createTextNode(this.config.max));
		this.canvas.appendChild(this.gaugeMIN);
	}
	this.refresh = function(valueNew, animated)
	{
		var oldValue = this.config.value;
		this.config.originalValue = valueNew;
		this.config.value = valueNew;
		if (this.config.value > this.config.max)
			this.config.value = this.config.max; 
		if (this.config.value < this.config.min)
			this.config.value = this.config.min;
		
		this.gaugeVAL.childNodes[0].textContent = this.config.value;
		if (animated == true)
		{
			var incrementValue = (this.config.value - oldValue) / this.animation.startIncrementDivisor;
			var gauge = this;
			setTimeout(function() {GaugeAnimationStep(gauge, oldValue, incrementValue, gauge.animation.maxIncrements);}, gauge.animation.delay);
		}
		else
		{
			this.gaugeNDL.setAttributeNS(null, 'd',
				this.calculateNeedlePath(this.config.value, this.config.min, this.config.max,
											 this.config.canvasW, this.config.canvasH,
											 this.config.offsetX, this.config.offsetY,
											 this.config.gaugeWidthScale + 0.49));
		}
	}
	this.randomSampleValue = function (min, max)
	{
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}    
}
function GaugeAnimationStep(gaugeSVG, valueCurrent, valueIncrement, incrementsLeft)
{
	if (incrementsLeft <= 0)
	{
		gaugeSVG.gaugeNDL.setAttributeNS(null, 'd',
			gaugeSVG.calculateNeedlePath(gaugeSVG.config.value, gaugeSVG.config.min, gaugeSVG.config.max,
										 gaugeSVG.config.canvasW, gaugeSVG.config.canvasH,
										 gaugeSVG.config.offsetX, gaugeSVG.config.offsetY,
										 gaugeSVG.config.gaugeWidthScale + 0.49));
	}
	else
	{
		valueCurrent = valueCurrent + valueIncrement;
		valueIncrement = valueIncrement * gaugeSVG.animation.decreaseOfIncrementValue;
		incrementsLeft = incrementsLeft - 1;
		gaugeSVG.gaugeNDL.setAttributeNS(null, 'd',
			gaugeSVG.calculateNeedlePath(valueCurrent, gaugeSVG.config.min, gaugeSVG.config.max,
										 gaugeSVG.config.canvasW, gaugeSVG.config.canvasH,
										 gaugeSVG.config.offsetX, gaugeSVG.config.offsetY,
										 gaugeSVG.config.gaugeWidthScale + 0.49));
		
		setTimeout(function() {GaugeAnimationStep(gaugeSVG, valueCurrent, valueIncrement, incrementsLeft);}, gaugeSVG.animation.delay);
	}
}
		window.onload = function(){
	var gauge1 = new GaugeSVG({
		id: "container1",
  		title: "CPU",
  		label: "hz(0,hz)",
 		labelColor: "#8888cc",
		canvasBackColor: "black",
  		gaugeBackColor: "#ccccff",
  		titleColor: "#8888cc",
		needleColor: "white",
		minmaxColor: "#444488"
	});
	
	var gauge2 = new GaugeSVG({
		id: "container2", 
		value: 49,
		valueColor: "#444488",
		min: 30,
		max: 70,
		minmaxColor: "#444488",
		title: "GPU",
		titleColor: "#8888cc",
		label: "hz(0,hz)",
		labelColor: "#8888cc",
		gaugeWidthScale: 1.25,
		gaugeBorderColor: "#222244",
		gaugeBorderWidth: 1.5,
		gaugeShadowColor: "#444488",
		gaugeShadowScale: 1.35,
		canvasBackColor: "black",
		gaugeBackColor: "#ccccff",
		needleColor: "white",
		lowerActionLimit: -1,
		lowerWarningLimit: -1,
		upperWarningLimit: -1,
		upperActionLimit: -1,
	});
	
	var gauge3 = new GaugeSVG({
		id: "container3", 
		value: 1, 
		title: "HDD",
		titleColor: "#8888cc",
		label: "hz(0,hz)",
		min: 20,
		max: 120,
		lowerActionLimit: -1,
		lowerWarningLimit: 60,
		upperWarningLimit: 105,
		upperActionLimit: -1,
		optimumRangeColor: "#88ff88",
		warningRangeColor: "#f4f444",
		canvasBackColor: "black",
		labelColor: "#8888cc",
		needleColor: "white",
		minmaxColor: "#444488"
	});
	var gauge4 = new GaugeSVG({
		id: "container4",
		value: 35.0,
		title: "Memory",
		titleColor: "#8888cc",
		label: "hz(0,hz)",
		gaugeWidthScale: 1.0,
		min: 0.0,
		max: 60.0,
		lowerActionLimit: -1,
		lowerWarningLimit: 0.0,
		needleColor: "white",
		optimumRangeColor: "#88ff88",
		warningRangeColor: "#f4f444",
		actionRangeColor: "#ff8888",
		labelColor: "#8888cc",
  		canvasBackColor: "black",
		minmaxColor: "#444488"
	});
	setInterval(function() {
	  gauge1.refresh(gauge1.randomSampleValue(0, 100));
	  gauge2.refresh(gauge2.randomSampleValue(34, 65), true);          
	  gauge3.refresh(gauge3.randomSampleValue(66, 100), true);
	  gauge4.refresh(gauge4.randomSampleValue(0, 600)/10.0, true);
	}, 2000);
  };
 
  new Vue({
	el: '#app',
	
	data: {
	  start: Date.now(),
	  end: Date.now(),
	  firstPoint: Date.now(),
	  secondPoint: Date.now(),
	  firstFrame: 0,
	  secondFrame: 0,
	  delay: 1,
	  counter: 0,
	},
	
	
	computed: {
	  ellapsed() {
		return (this.end - this.start) / 1000;
	  },
	  ellapsedCounter() {
		return this.counter * this.delay / 1000;
	  },
	  diff() {
		return this.ellapsed - this.ellapsedCounter;
	  },
	  fpsAvg() {
		return this.counter / this.ellapsed;
	  },
	  fps() {
		return (this.secondFrame - this.firstFrame) / (this.secondPoint - this.firstPoint) * 1000;
	  }
	},
	
	mounted() {
	  setInterval(this.update, this.delay);
	  setInterval(this.updatePoints, 1000);
	},
	
	methods: {
	  update() {
		this.end = Date.now();
		this.counter++;
	  },
	  updatePoints() {
		this.firstPoint = this.secondPoint;
		this.secondPoint = Date.now();
		this.firstFrame = this.secondFrame;
		this.secondFrame = this.counter;
	  }
	}
  });