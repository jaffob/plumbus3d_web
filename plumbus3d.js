var x = 400.0, y = 300.0;	// X,Y coordinates of the player.
var dir = 0.0;				// Direction player is facing, in radians.

var walls = [
{x1:200,y1:200,x2:300,y2:200},
{x1:500,y1:200,x2:500,y2:400}
];

function draw()
{
	var c2d = document.getElementById("canvas2d").getContext("2d");
	
	console.log("drawing now");
	c2d.moveTo(100,100);
	c2d.lineTo(200,200);
	c2d.stroke();
	
	for (var i = 0; i < walls.length; i++)
	{
		c2d.moveTo(walls[i].x1, walls[i].y1);
		c2d.lineTo(walls[i].x2, walls[i].y2);
		c2d.stroke();
	}
}