// ***************************************
//                CONSTANTS
// ***************************************

// Gameplay
var FPS = 60;					// Framerate and update rate, per second.
var PI = Math.PI;
var SCREEN_WIDTH = 800			// Width of the canvas being drawn on.
var SCREEN_HEIGHT = 600;		// Height of the canvas.
var FOV_CHANGE_RATE = PI/4;		// Change rate for FOV controls.
var FOV_MIN = PI/32;
var FOV_MAX = PI;

// World
var WALL_HEIGHT = 100;

// Colors
var COLOR_GROUND = "#008000";
var COLOR_SKY = "#00BFFF";
var COLOR_WALL = "#000000";

// 2D drawing

var C2D_PLAYER_RADIUS = 10;
var C2D_FOV_LINE_LENGTH = 250;

// ***************************************
//               VARIABLES
// ***************************************

// Define the player and its values.
var player =
{
	x: 400, y: 300,		// Current coordinates
	dir: 0,				// Current direction in radians
	vf: 200,			// Movement speed, per second
	vr: 3*PI/4,			// Rotation speed, radians per second
	
	fov: PI/2,			// Field of view, radians
	height: 50			// Height off the ground of the camera
};

// Define the array of walls.
var walls = [
{x1:200,y1:200,x2:400,y2:200},
{x1:500,y1:200,x2:500,y2:400},
//{x1:500,y1:250,x2:500,y2:350},
{x1:400,y1:200,x2:200,y2:400},
//{x1:350,y1:250,x2:250,y2:350}
];

// Variables for input.
var input =
{
	left: false,
	right: false,
	forward: false,
	backward: false,
	strafeleft: false,
	straferight: false,
	fovup: false,
	fovdown: false,
};

// Engine flags.
var flags = 
{
	SimpleDistance: false,
	C2D_FOVLines: true
};

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
	var df = player.vf / FPS;
	var dr = player.vr / FPS;
	
	// Rotation.
	if (input.left) player.dir = (player.dir - dr) % (2*PI);
	if (input.right) player.dir = (player.dir + dr) % (2*PI);
	
	// Mod in JavaScript is weird.
	if (player.dir < 0) player.dir += 2*PI;
	
	// Walking.
	if (input.forward)
	{
		player.x += df * Math.cos(player.dir);
		player.y += df * Math.sin(player.dir);
	}
	if (input.backward)
	{
		player.x -= df * Math.cos(player.dir);
		player.y -= df * Math.sin(player.dir);
	}
	
	// Strafing.
	if (input.straferight)
	{
		player.x += df * Math.cos(player.dir + PI/2);
		player.y += df * Math.sin(player.dir + PI/2);
	}
	if (input.strafeleft)
	{
		player.x -= df * Math.cos(player.dir + PI/2);
		player.y -= df * Math.sin(player.dir + PI/2);
	}
	
	// FOV changing.
	if (input.fovup)
	{
		player.fov = Math.min(player.fov + FOV_CHANGE_RATE / FPS, FOV_MAX);
	}
	if (input.fovdown)
	{
		player.fov = Math.max(player.fov - FOV_CHANGE_RATE / FPS, FOV_MIN);
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
		var va1 = worldCoordsToViewAngles(wall.x1, wall.y1, WALL_HEIGHT * i);
		if (Math.abs(va1.azimuth) > player.fov / 2)
		{
			var fovdir = player.dir + (player.fov / 2) * (va1.azimuth / Math.abs(va1.azimuth));
			var newxy = intersectLineAngle(player.x, player.y, fovdir, wall.x1, wall.y1, wall.x2, wall.y2);
			va1 = worldCoordsToViewAngles(newxy.x, newxy.y, WALL_HEIGHT * i);
		}
		
		view_angles.push(va1);
		view_coords.push(viewAnglesToViewCoords(va1));
		
		// Push angles and coords for (x2,y2).
		var va2 = worldCoordsToViewAngles(wall.x2, wall.y2, WALL_HEIGHT * i);
		if (Math.abs(va2.azimuth) > player.fov / 2)
		{
			var fovdir = player.dir + (player.fov / 2) * (va2.azimuth / Math.abs(va2.azimuth));
			var newxy = intersectLineAngle(player.x, player.y, fovdir, wall.x1, wall.y1, wall.x2, wall.y2);
			va2 = worldCoordsToViewAngles(newxy.x, newxy.y, WALL_HEIGHT * i);
		}
		
		view_angles.push(va2);
		view_coords.push(viewAnglesToViewCoords(va2));
		
		if (Math.abs(va1.azimuth) > player.fov/2 && Math.abs(va2.azimuth) > player.fov/2) return;
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
	
	// Draw FOV lines if requested.
	c2d.strokeStyle = "#808080";
	c2d.moveTo(player.x, player.y);
	c2d.lineTo(player.x + C2D_FOV_LINE_LENGTH * Math.cos(player.dir + player.fov/2), player.y + C2D_FOV_LINE_LENGTH * Math.sin(player.dir + player.fov/2));
	c2d.stroke();
	c2d.moveTo(player.x, player.y);
	c2d.lineTo(player.x + C2D_FOV_LINE_LENGTH * Math.cos(player.dir - player.fov/2), player.y + C2D_FOV_LINE_LENGTH * Math.sin(player.dir - player.fov/2));
	c2d.stroke();
	
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
	var distToWall = flags.SimpleDistance ?
		distPoints(player.x, player.y, x, y) :
		distToWallPoint(player.x, player.y, player.dir, x, y);
	result.elevation = Math.atan((player.height - z) / distToWall);
	
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
	var hfov = player.fov;
	var vfov = player.fov * (SCREEN_HEIGHT / SCREEN_WIDTH);
	
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
		input.left = true;
		break;
	case 68:
		input.right = true;
		break;
		
	// Forward-back movement.
	case 87:
		input.forward = true;
		break;
	case 83:
		input.backward = true;
		break;
	
	// Strafe.
	case 75:
		input.strafeleft = true;
		break;
	case 76:
		input.straferight = true;
		break;
	
	// Change FOV.
	case 79:
		input.fovdown = true;
		break;
	case 80:
		input.fovup = true;
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
		input.left = false;
		break;
	case 68:
		input.right = false;
		break;
		
	// Forward-back movement.
	case 87:
		input.forward = false;
		break;
	case 83:
		input.backward = false;
		break;
		
	// Strafe.
	case 75:
		input.strafeleft = false;
		break;
	case 76:
		input.straferight = false;
		break;
	
	// Change FOV.
	case 79:
		input.fovdown = false;
		break;
	case 80:
		input.fovup = false;
		break;
	}
});

// ***************************************
//           HELPER FUNCTIONS
// ***************************************

function distPoints(x1, y1, x2, y2)
{
	return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}

function distToWallPoint(px, py, pdir, wx, wy)
{
	// Define vector from player to wallpoint.
	var dx = wx - px;
	
	var dy = wy - py;
	dx *= Math.cos(pdir);
	dy *= Math.sin(pdir);
	
	// Return magnitude of the resulting vector.
	return Math.sqrt(dx*dx + dy*dy);
}

/**
 * Calculates the point of intersection between two lines, given
 * in point-slope form. Probably not the cleanest math, but ehh.
 */
function intersectLines(x1, y1, m1, x2, y2, m2)
{
	// If the slopes are the same, they're parallel.
	if (m1 == m2)
		return null;
		
	var result = {x: 0, y: 0};
	
	// I solved point-slope equations on paper and got this.
	result.x = (m1*x1 - m2*x2 + y2 - y1) / (m1 - m2);
	result.y = m1 * (result.x - x1) + y1;
	
	return result;
}

/**
 * Calculates the point of intersection between two lines, one of
 * which is in point slope form and one of which is vertical.
 */
function intersectLineVertical(x1, y1, m1, x2)
{
	return {x: x2, y: m1 * (x2 - x1) + y1};
}

/**
 * Gets the point where a line (defined by two points) intersects
 * with a line extended from a point and angle. This will extend
 * both lines indefinitely.
 */
function intersectLineAngle(ax, ay, adir, lx1, ly1, lx2, ly2)
{
	// Both lines are vertical.
	if (lx2 - lx1 == 0 && (adir + PI/2) % PI == 0)
		return null;
		
	// The two-point line is vertical
	if (lx2 - lx1 == 0)
		return intersectLineVertical(ax, ay, Math.tan(adir), lx1);
	
	var lm = (ly2 - ly1) / (lx2 - lx1);
	
	// The angle line is vertical.
	if ((adir + PI/2) % PI == 0)
		return intersectLineVertical(lx1, ly1, lm, ax);
	
	// Otherwise, do a standard point-slope intersection.
	return intersectLines(ax, ay, Math.tan(adir), lx1, ly1, lm);
}