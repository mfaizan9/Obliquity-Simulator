function SliderV3GrabberClass()
{
}
var p = SliderV3GrabberClass.prototype = new MovieClip();
Object.registerClass("SliderV3GrabberSymbol",SliderV3GrabberClass);
p.useHandCursor = false;
p.onPress = function()
{
   this._offset = this._parent._xmouse - this._x;
   this.onMouseMove = this.onMouseMoveFunc;
};
p.onMouseMoveFunc = function()
{
   var newValue = this._parent._min + this._parent._scale * (this._parent._xmouse - this._offset + this._parent._hw);
   this._parent.value = newValue;
   this._parent.callHandler();
   updateAfterEvent();
};
p.onRelease = p.onReleaseOutside = function()
{
   this.onMouseMove = undefined;
};
