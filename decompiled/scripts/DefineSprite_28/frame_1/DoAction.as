function update(obliquity)
{
   clear();
   lineStyle(3,16777215,100);
   drawArc(0,0,120,1.5707963267948966 - obliquity * 0.017453292519943295,1.5707963267948966);
   earth._rotation = obliquity;
   degreeLabel._x = -150 * Math.cos(1.5707963267948966 + obliquity * 0.008726646259971648);
   degreeLabel._y = -150 * Math.sin(1.5707963267948966 + obliquity * 0.008726646259971648);
   degreeLabel.labelText = obliquity + "°";
}
MovieClip.prototype.maxArcStep = 0.5;
MovieClip.prototype.drawArc = function(x, y, radius, startAngle, endAngle)
{
   if(startAngle < 0)
   {
      startAngle = startAngle % 6.283185307179586 + 6.283185307179586;
   }
   else
   {
      startAngle %= 6.283185307179586;
   }
   if(endAngle < 0)
   {
      endAngle = endAngle % 6.283185307179586 + 6.283185307179586;
   }
   else
   {
      endAngle %= 6.283185307179586;
   }
   var range = endAngle - startAngle;
   if(range < 0)
   {
      range = 6.283185307179586 + range;
   }
   var n = Math.ceil(range / this.maxArcStep);
   var step = range / n;
   var half = step / 2;
   var cos = Math.cos;
   var sin = Math.sin;
   var cRadius = radius / cos(half);
   var aAngle = startAngle;
   var cAngle = startAngle - half;
   this.moveTo(x + radius * cos(startAngle),y - radius * sin(startAngle));
   var i = 0;
   while(i < n)
   {
      aAngle += step;
      cAngle += step;
      this.curveTo(x + cRadius * cos(cAngle),y - cRadius * sin(cAngle),x + radius * cos(aAngle),y - radius * sin(aAngle));
      i++;
   }
};
update(23.5);
