// ***************************************
//                CONSTANTS
// ***************************************

// Gameplay
var FPS = 60;					// Framerate and update rate, per second.
var PI = Math.PI;
var SCREEN_WIDTH = 800			// Width of the canvas being drawn on.
var SCREEN_HEIGHT = 600;		// Height of the canvas.

// Player
var FOV = PI/2;					// Player's field of view, in radians.					
var PLAYER_HEIGHT = 50;			// Height of the player (i.e. how high the camera is).

// World
var WALL_HEIGHT = 100;

// Colors
var COLOR_GROUND = "#008000";
var COLOR_SKY = "#00BFFF";
var COLOR_WALL = "#000000";

// 2D drawing

var C2D_PLAYER_RADIUS = 10;


// ***************************************
//               VARIABLES
// ***************************************

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

// Variables for input.
var input_right = false, input_left = false;
var input_forward = false, input_backward = false;

function start()
{
	setInterval(run, 1000/FPS);
}

function run()
{
	handleInput();
	draw("canvas");
	draw2d("canvas2d");
}

function handleInput()
{
	var df = player.vf * (1/FPS);
	var dr = player.vr * (1/FPS);
	
	// Rotation.
	if (input_left) player.dir = (player.dir - dr) % (2*PI);
	if (input_right) player.dir = (player.dir + dr) % (2*PI);
	
	// Mod in JavaScript is weird.
	if (player.dir < 0) player.dir += 2*PI;
	
	// Walking.
	if (input_forward)
	{
		player.x += df * Math.cos(player.dir);
		player.y += df * Math.sin(player.dir);
	}
	if (input_backward)
	{
		player.x -= df * Math.cos(player.dir);
		player.y -= df * Math.sin(player.dir);
	}
}

function draw(canvas_id)
{
	var c = document.getElementById(canvas_id).getContext("2d");
	
	// Draw the sky and ground.
	c.fillStyle = COLOR_SKY;
	c.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2);
	c.fillStyle = COLOR_GROUND;
	c.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT);
	
	// Draw walls.
	for (var i = 0; i < walls.length; i++)
	{
		drawWall(c, i);
	}
}

function drawWall(c, wall_index)
{
	var wall = walls[wall_index];
	
	// Create arrays of angle sets and view coordinates, representing each wall corner.
	var view_angles = [];
	var view_coords = [];
	
	for (var i = 0; i < 2; i++)
	{
		// Push angles and coords for (x1,y1).
		var va = worldCoordsToViewAngles(wall.x1, wall.y1, WALL_HEIGHT * i);
		if (Math.abs(va.azimuth) > PI/2) return;
		view_angles.push(va);
		view_coords.push(viewAnglesToViewCoords(va));
		
		// Push angles and coords for (x2,y2).
		va = worldCoordsToViewAngles(wall.x2, wall.y2, WALL_HEIGHT * i);
		if (Math.abs(va.azimuth) > PI/2) return;
		view_angles.push(va);
		view_coords.push(viewAnglesToViewCoords(va));
	}
	
	// Draw the wall from the coordinates found. This is a bit hardcoded because order is weird.
	c.fillStyle = COLOR_WALL;
	c.beginPath();
	c.moveTo(view_coords[0].x, view_coords[0].y);
	c.lineTo(view_coords[1].x, view_coords[1].y);
	c.lineTo(view_coords[3].x, view_coords[3].y);
	c.lineTo(view_coords[2].x, view_coords[2].y);
	c.closePath();
	c.fill();
}

function draw2d(canvas_id)
{
	var c2d = document.getElementById(canvas_id).getContext("2d");
	
	c2d.clearRect(0, 0, canvas.width, canvas.height);
	
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

/**
 * From an X,Y,Z coordinate in the world, calculates the
 * angles of these points away from the center of the
 * player's view. Returns an object containing azimuth
 * and elevation angles.
 */
function worldCoordsToViewAngles(x, y, z)
{
	var result = {azimuth: 0, elevation: 0};
	
	// Get the horizontal angle from the center of view (positive = to the right).
	var abs_angle = Math.atan2(player.y - y, player.x - x) + PI;
	result.azimuth = Math.atan2(Math.sin(abs_angle - player.dir), Math.cos(abs_angle - player.dir));
	
	// Get the vertical angle (based on player height and distance, positive = down).
	result.elevation = Math.atan((PLAYER_HEIGHT - z) / distPoints(player.x, player.y, x, y));
	
	return result;
}

/**
 * Given an object containing azimuth and elevation angles,
 * calculates the point on the screen where this space should
 * be drawn.
 */
function viewAnglesToViewCoords(viewAngles)
{
	var result = {x: 0, y: 0};
	
	// Get our field of views.
	var hfov = FOV;
	var vfov = FOV * (SCREEN_HEIGHT / SCREEN_WIDTH);
	
	// Get the number of FOVs from the center along each axis.
	var hratio = viewAngles.azimuth / hfov;
	var vratio = viewAngles.elevation / vfov;
	
	// Calculate the result based on the screen size.
	result.x = SCREEN_WIDTH * (hratio + 0.5);
	result.y = SCREEN_HEIGHT * (vratio + 0.5);
	
	return result;
}

/**
 * Handle keys down.
 */
window.addEventListener('keydown', function(event)
{
	switch (event.keyCode)
	{
	// Rotation.
	case 65:
		input_left = true;
		break;
	case 68:
		input_right = true;
		break;
		
	// Forward-back movement.
	case 87:
		input_forward = true;
		break;
	case 83:
		input_backward = true;
		break;
	}
});

/**
 * Handle keys up.
 */
window.addEventListener('keyup', function(event)
{
	switch (event.keyCode)
	{
	// Rotation.
	case 65:
		input_left = false;
		break;
	case 68:
		input_right = false;
		break;
		
	// Forward-back movement.
	case 87:
		input_forward = false;
		break;
	case 83:
		input_backward = false;
		break;
	}
});

function distPoints(x1, y1, x2, y2)
{
	return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}