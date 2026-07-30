function SliderV3Class()
{
   this.attachMovie("SliderV3MinMaxSymbol","_minLabel",1,{_y:14});
   this.attachMovie("SliderV3MinMaxSymbol","_maxLabel",2,{_y:14});
   this.attachMovie("SliderV3ValueSymbol","_valueLabel",3,{_y:-35});
   this.attachMovie("SliderV3TitleSymbol","_titleLabel",4,{_y:-35});
   this._previewFrame._visible = false;
   this.setSliderWidth(2 * this._xscale);
   this._xscale = 100;
   this._yscale = 100;
   this.setTitle(this.initTitle);
   this.min = this.initMin;
   this.max = this.initMax;
   this.setPrecision(this.initPrecision);
   this.value = this.initValue;
}
var p = SliderV3Class.prototype = new MovieClip();
Object.registerClass("SliderV3Symbol",SliderV3Class);
p.setTitle = function(arg)
{
   this._titleLabel.labelText = arg;
};
p.setSliderWidth = function(arg)
{
   var hw = Math.abs(arg / 2);
   if(hw > 0)
   {
      this._bar._xscale = hw;
      this._minLabel._x = - hw;
      this._maxLabel._x = hw;
      this._titleLabel._x = -12 - hw;
      this._valueLabel._x = 12 + hw;
      this._hw = hw;
      this._scale = (this._max - this._min) / (2 * this._hw);
      this.positionSlider();
   }
};
p.setPrecision = function(arg)
{
   var x = parseInt(arg);
   if(isFinite(x))
   {
      if(x > 15)
      {
         x = 15;
      }
      this._prec = x;
      this._minIncrement = Math.pow(10,- x);
   }
};
p.toFixed = function(x)
{
   var f = this._prec;
   var s = "";
   if(x < 0)
   {
      s = "-";
      x = - x;
   }
   var m = "";
   if(x < 1e+21)
   {
      var n = Math.round(x * Math.pow(10,f));
      if(n == 0)
      {
         m = "0";
      }
      else
      {
         m = n.toString();
      }
      if(f > 0)
      {
         var k = m.length;
         if(k <= f)
         {
            var z = "";
            var i = 0;
            while(i < f + 1 - k)
            {
               z += "0";
               i++;
            }
            m = z + m;
            k = f + 1;
         }
         var a = m.substr(0,k - f);
         var b = m.substr(k - f);
         m = a + "." + b;
      }
   }
   else
   {
      m = x.toString();
   }
   return s + m;
};
p.positionSlider = function()
{
   this._grabber._x = (this._value - this._min) / this._scale - this._hw;
};
p.getMin = function()
{
   return this._min;
};
p.setMin = function(arg)
{
   var x = Number(arg);
   if(isFinite(x))
   {
      this._min = x;
      this._scale = (this._max - this._min) / (2 * this._hw);
      this._minLabel.labelText = this._min;
   }
};
p.addProperty("min",p.getMin,p.setMin);
p.getMax = function()
{
   return this._max;
};
p.setMax = function(arg)
{
   var x = Number(arg);
   if(isFinite(x))
   {
      this._max = x;
      this._scale = (this._max - this._min) / (2 * this._hw);
      this._maxLabel.labelText = this._max;
   }
};
p.addProperty("max",p.getMax,p.setMax);
p.getValue = function()
{
   return this._value;
};
p.setValue = function(arg)
{
   var x = Number(arg);
   if(isFinite(x))
   {
      var k = Math.pow(10,this._prec);
      this._value = Math.round(k * x) / k;
      if(this._value < this._min)
      {
         this._value = this._min;
      }
      else if(this._value > this._max)
      {
         this._value = this._max;
      }
      if(this._prec > 0)
      {
         this._valueLabel.labelText = this.toFixed(this._value);
      }
      else
      {
         this._valueLabel.labelText = this._value;
      }
      this.positionSlider();
   }
};
p.addProperty("value",p.getValue,p.setValue);
p.callHandler = function()
{
   this._parent[this.changeHandler](this._value);
};
