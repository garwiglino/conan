package openfl.geom;
class Rectangle {
 public var x:Float;public var y:Float;public var width:Float;public var height:Float;
 public var left(get,set):Float;public var right(get,set):Float;public var top(get,set):Float;public var bottom(get,set):Float;
 public function new(x:Float=0,y:Float=0,width:Float=0,height:Float=0){this.x=x;this.y=y;this.width=width;this.height=height;}
 function get_left():Float return x;function get_right():Float return x+width;
 function get_top():Float return y;function get_bottom():Float return y+height;
 function set_left(v:Float):Float{width+=x-v;return x=v;}function set_right(v:Float):Float{width=v-x;return v;}
 function set_top(v:Float):Float{height+=y-v;return y=v;}function set_bottom(v:Float):Float{height=v-y;return v;}
}
