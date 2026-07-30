function SliderV3BarClass()
{
}
var p = SliderV3BarClass.prototype = new MovieClip();
Object.registerClass("SliderV3BarSymbol",SliderV3BarClass);
p.useHandCursor = false;
p._holdDelay = 500;
p.onPress = function()
{
   if(this._parent._xmouse < this._parent._grabber._x)
   {
      this._parent.value -= this._parent._minIncrement;
   }
   else
   {
      this._parent.value += this._parent._minIncrement;
   }
   this._parent.callHandler();
   this._startAuto = getTimer() + this._holdDelay;
   this.onEnterFrame = this.onEnterFrameFunc;
};
p.onEnterFrameFunc = function()
{
   if(getTimer() > this._startAuto)
   {
      if(this._parent._xmouse < this._parent._grabber._x)
      {
         this._parent.value -= this._parent._minIncrement;
      }
      else
      {
         this._parent.value += this._parent._minIncrement;
      }
      this._parent.callHandler();
   }
};
p.onRelease = p.onReleaseOutside = function()
{
   this.onEnterFrame = undefined;
};
