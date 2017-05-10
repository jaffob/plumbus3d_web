// Gameplay constants.
var FPS = 10;
var PI = Math.PI;

// 2D drawing constants.
var C2D_PLAYER_RADIUS = 10;

// Define the player and its values.
var player = {

	x: 400, y: 300,		// Current coordinates
	dir: 0,				// Current direction in radians
	vf: 200,			// Movement speed, per second
	vr: PI				// Rotation speed, radians per second
}

// Define the array of walls.
var walls = [
{x1:200,y1:200,x2:400,y2:200},
{x1:500,y1:200,x2:500,y2:400}
];

function start()
{
	setInterval(run, 1000/FPS);
}

function run()
{
	draw();
}

function draw()
{
	draw2d("canvas2d");
}

function draw2d(canvas_id)
{
	var c2d = document.getElementById(canvas_id).getContext("2d");
	
	// Draw player in 2D.
	c2d.beginPath();
	c2d.arc(player.x, player.y, C2D_PLAYER_RADIUS, 0, 2 * Math.PI, false);
	c2d.fillStyle = "#FF0000";
	c2d.strokeStyle = "#FF0000";
	c2d.closePath();
	c2d.fill();
	c2d.stroke();
	
	// Draw player direction in 2D.
	c2d.strokeStyle = "#000000";
	c2d.moveTo(player.x, player.y);
	c2d.lineTo(player.x + C2D_PLAYER_RADIUS * 2 * Math.cos(player.dir), player.y + C2D_PLAYER_RADIUS * 2 * Math.sin(player.dir));
	c2d.stroke();
	
	for (var i = 0; i < walls.length; i++)
	{
		c2d.moveTo(walls[i].x1, walls[i].y1);
		c2d.lineTo(walls[i].x2, walls[i].y2);
		c2d.stroke();
	}
}

window.addEventListener('keydown', function(event)
{

});