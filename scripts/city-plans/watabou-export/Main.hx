import com.watabou.towngenerator.building.Model;
import com.watabou.geom.Polygon;
import openfl.geom.Point;
class Main {
 static function points(p:Polygon):Array<Array<Float>> return [for(v in p)[v.x,v.y]];
 static function main(){
  var size=Std.parseInt(Sys.args()[0]),seed=Std.parseInt(Sys.args()[1]);
  // Features are passed explicitly by the authoring-only constructor patch.
  var m=new Model(size,seed,true,false,false);
  var data:Dynamic={size:size,seed:seed,features:{plaza:true,citadel:false,walls:false,water:false},center:[m.center.x,m.center.y],radius:m.cityRadius,
   patches:[for(i in 0...m.patches.length){var p=m.patches[i];{id:i,withinCity:p.withinCity,ward:Type.getClassName(Type.getClass(p.ward)).split('.').pop(),shape:points(p.shape),buildings:[for(g in p.ward.geometry)points(g)]};}],
   streets:[for(p in m.streets)points(p)],roads:[for(p in m.roads)points(p)],arteries:[for(p in m.arteries)points(p)],border:points(m.border.shape),gates:[for(p in m.gates)[p.x,p.y]]};
  sys.io.File.saveContent(Sys.args()[2],haxe.Json.stringify(data));
 }
}
