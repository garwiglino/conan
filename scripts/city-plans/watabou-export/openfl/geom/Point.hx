package openfl.geom;
// Minimal headless geometry compatibility; no rendering or game code.
class Point {
 public var x:Float; public var y:Float;
 public var length(get,never):Float;
 public function new(x:Float=0,y:Float=0){this.x=x;this.y=y;}
 function get_length():Float return Math.sqrt(x*x+y*y);
 public function clone():Point return new Point(x,y);
 public function add(p:Point):Point return new Point(x+p.x,y+p.y);
 public function subtract(p:Point):Point return new Point(x-p.x,y-p.y);
 public function normalize(n:Float):Void {var l=length;if(l>0){x*=n/l;y*=n/l;}}
 public function setTo(x:Float,y:Float):Void{this.x=x;this.y=y;}
 public function offset(dx:Float,dy:Float):Void{x+=dx;y+=dy;}
 public function equals(p:Point):Bool return x==p.x&&y==p.y;
 public static function distance(a:Point,b:Point):Float return a.subtract(b).length;
 public static function interpolate(a:Point,b:Point,f:Float):Point return new Point(b.x+(a.x-b.x)*f,b.y+(a.y-b.y)*f);
 public static function polar(l:Float,a:Float):Point return new Point(l*Math.cos(a),l*Math.sin(a));
}
