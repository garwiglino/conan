// Habillage: the garment Kaldor pulls over his head in the 'dress' clip,
// frames 1 to 3, drawn in the colours of the outfit being put on.
// a/b/c: light, mid, dark cloth of the outfit being put on; '#': ink.
// Views: face, droite, dos (gauche mirrors droite). x starts at 29.
const CLOTH={
 face:{
1:`
39 .........#####
40 ........#aaaab#
41 ........#abbbc#
42 ........#bbccc#
43 .........#####`,
2:`
28 ..........###
29 ........##aaa##
30 ......##aaaaabb##
31 .....#aaaabbbbbbb#
32 ....#aaabbbbbbbbbc#
33 ...#aab#########bcc#
34 ...#ab#.........#bc#
35 ...#ab#.........#bc#
36 ...#bb#.........#cc#`,
3:`
29 .........#####
30 .......##aaaaa##
31 .....##aaaaaaabb##
32 ....#aaaaaaabbbbbb#
33 ...#aaaaaabbbbbbbbc#
34 ...#aaaabbbbbbbbbbc#
35 ..#aaabbbbbbbbbbbbcc#
36 ..#aabb##########bcc#
37 ..#abb#..........#cc#
38 ...###............##`},
 droite:{
1:`
39 .............####
40 ............#aaab#
41 ............#abbc#
42 ............#bbcc#
43 .............####`,
2:`
28 ..........###
29 ........##aaa##
30 ......##aaaaabb##
31 .....#aaaabbbbbbb#
32 ....#aaabbbbbbbbbc#
33 ....##############bc#
34 ................#abc#
35 ................#bc#`,
3:`
29 .........#####
30 .......##aaaaa##
31 .....##aaaaaaabb##
32 ....#aaaaaaabbbbbb#
33 ...#aaaaaabbbbbbbbc#
34 ...#aaaabbbbbbbbbbc#
35 ..#aaabbbbbbbbbbbbcc#
36 ..#####aab#######bcc#
37 ...........#....#bc#`}
};
CLOTH.dos={2:CLOTH.face[2],3:CLOTH.face[3]};
module.exports={CLOTH};
