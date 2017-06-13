// ***************************************
//                CONSTANTS
// ***************************************

// Gameplay
var FPS = 60;					// Framerate and update rate, per second.
var PI = Math.PI;
var SCREEN_WIDTH = 800;			// Width of the canvas being drawn on.
var SCREEN_HEIGHT = 600;		// Height of the canvas.
var FOV_CHANGE_RATE = PI/4;		// Change rate for FOV controls.
var FOV_MIN = PI/32;
var FOV_MAX = PI;

// World
var WALL_HEIGHT_DEFAULT = 100;

// Colors
var COLOR_GROUND = "#008000";
var COLOR_SKY = "#00BFFF";
var COLOR_WALL_DEFAULT = "#000000";

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
{x1:200,y1:200,x2:400,y2:200,h:100,color:"#FF0000"},
{x1:500,y1:200,x2:500,y2:400,h:100,color:"#00FF00"},
{x1:400,y1:200,x2:200,y2:400,h:100,color:"#0000FF"},
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
	wallEndpointCorrection: 2,
	basicMode: false,
	C2D_FOVLines: true
};


// ***************************************
//            STARTUP/ENGINE
// ***************************************

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


// ***************************************
//                DRAWING
// ***************************************

function draw(canvas_id)
{
	var c = document.getElementById(canvas_id).getContext("2d");
	
	// Draw the sky and ground.
	c.fillStyle = COLOR_SKY;
	c.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2);
	c.fillStyle = COLOR_GROUND;
	c.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT);
	
	// Draw walls. In basic mode, just draw each wall in no particular order (and hence with no color).
	if (flags.basicMode)
	{
		for (var i = 0; i < walls.length; i++)
		{
			drawWall(c, i);
		}
	}
	else
	{
		var drawOrder = calcDrawOrder();
		for (var i = 0; i < drawOrder.length; i++)
		{
			drawWall(c, drawOrder[i]);
		}
	}
}

function drawWall(c, wall_index)
{
	var wall = walls[wall_index];
	var wallheight = wall.h == undefined ? WALL_HEIGHT_DEFAULT : wall.h;
	// Create arrays of angle sets and view coordinates, representing each wall corner.
	var view_angles = [];
	var view_coords = [];
	
	if (wallIsBehindPlayer(wall))
	{
		return;
	}
	
	for (var i = 0; i < 2; i++)
	{
		// Push angles and coords for (x1,y1).
		var va1 = worldCoordsToViewAngles(wall.x1, wall.y1, wallheight * i);
		va1 = correctOutOfViewAngles(va1, wall, wallheight * i);
		
		view_angles.push(va1);
		view_coords.push(viewAnglesToViewCoords(va1));
		
		// Push angles and coords for (x2,y2).
		var va2 = worldCoordsToViewAngles(wall.x2, wall.y2, wallheight * i);
		va2 = correctOutOfViewAngles(va2, wall, wallheight * i);
		
		view_angles.push(va2);
		view_coords.push(viewAnglesToViewCoords(va2));
		
		if (Math.abs(va1.azimuth) > player.fov/2 && Math.abs(va2.azimuth) > player.fov/2) return;
	}
	
	// Determine wall color.
	c.fillStyle = COLOR_WALL_DEFAULT;
	if (!flags.basicMode && wall.color != undefined)
		c.fillStyle = wall.color;
		
	// Draw the wall from the coordinates found. This is a bit hardcoded because order is weird.
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

function calcDrawOrder()
{
	// Wall indices in order of when they'll be drawn. Later in
	// the list means drawn later, which means the wall is closer.
	var drawOrder = [];
	
	// Outer loop goes through each wall.
	for (var i = 0; i < walls.length; i++)
	{
		// If the wall is completely behind the player, don't bother.
		if (wallIsBehindPlayer(walls[i]))
			continue;
			
		// Decide where to place this wall in the current draw order list.
		// We take advantage of the fact that the existing list is already
		// sorted by draw order.
		var placed = false;
		for (var j = 0; j < drawOrder.length; j++)
		{
			var obsc = calcWallObscurity(walls[i], walls[drawOrder[j]]);

			// If our wall of interest is obscured by this wall in the draw
			// order, stop here. We place our current wall before this wall.
			if (obsc == -1)
			{
				drawOrder.splice(j, 0, i);
				placed = true;
				break;
			}
		}
		
		// If the wall didn't get placed, put it at the end.
		if (!placed)
		{
			drawOrder.push(i);
		}
	}
	
	return drawOrder;
}

/**
 * Determines whether one wall obscures another by being in front
 * of it. Returns 1 if wall1 obscures wall2, -1 if wall2 obscures
 * wall1, and 0 if the walls don't obscure each other.
 */
function calcWallObscurity(wall1, wall2)
{
	// Get azimuth angles to each wallpoint.
	var aw1p1 = azimuthAngle(player.x, player.y, player.dir, wall1.x1, wall1.y1);
	var aw1p2 = azimuthAngle(player.x, player.y, player.dir, wall1.x2, wall1.y2);
	var aw2p1 = azimuthAngle(player.x, player.y, player.dir, wall2.x1, wall2.y1);
	var aw2p2 = azimuthAngle(player.x, player.y, player.dir, wall2.x2, wall2.y2);
	
	var output = calcWallObs_Check(aw1p1, aw2p1, aw2p2, wall1.x1, wall1.y1, wall1, wall2);
	if (output != 0) return output;
	
	output = calcWallObs_Check(aw1p2, aw2p1, aw2p2, wall1.x2, wall1.y2, wall1, wall2);
	if (output != 0) return output;
	
	output = calcWallObs_Check(aw2p1, aw1p1, aw1p2, wall2.x1, wall2.y1, wall2, wall1);
	if (output != 0) return -output;
	
	output = calcWallObs_Check(aw2p2, aw1p1, aw1p2, wall2.x2, wall2.y2,  wall2, wall1);
	return -output;
}

function calcWallObs_Check(a11, a21, a22, px, py, wall1, wall2)
{
	if ((a11 < a21 && a11 > a22) || (a11 > a21 && a11 < a22))
	{
		// Get the distances to wall 1 point 1, and where the line extended through there meets wall 2.
		var dw1 = distPoints(player.x, player.y, px, py);
		var intersectw2 = intersectLineAngle(player.x, player.y, player.dir + a11, wall2.x1, wall2.y1, wall2.x2, wall2.y2);
		var dw2 = distPoints(player.x, player.y, intersectw2.x, intersectw2.y);
		
		return dw1 > dw2 ? -1 : 1;
	}
	
	return 0;
}

/**
 * Determines if a wall is completely behind the player. Since the
 * engine does not allow fields of view greater than 180 degrees,
 * a wall being behind the player means there is no way we have to
 * draw it.
 */
function wallIsBehindPlayer(wall)
{
	var dx1 = wall.x1 - player.x;
	var dy1 = wall.y1 - player.y;
	var dx2 = wall.x2 - player.x;
	var dy2 = wall.y2 - player.y;
	
	dx1 *= Math.cos(player.dir);
	dy1 *= Math.sin(player.dir);
	dx2 *= Math.cos(player.dir);
	dy2 *= Math.sin(player.dir);
	
	return dx1 + dy1 <= 0 && dx2 + dy2 <= 0;
}

// ***************************************
//             PLAYER INPUT
// ***************************************

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
//       WORLD/TRANSFORM FUNCTIONS
// ***************************************

/* Note: I distinguish these functions from helper functions because
   they reference the player object. */
   
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
	result.azimuth = azimuthAngle(player.x, player.y, player.dir, x, y);
	
	// Get the vertical angle (based on player height and distance, positive = down).
	var distToWall = flags.SimpleDistance ?
		distPoints(player.x, player.y, x, y) :
		distPointsInDirection(player.x, player.y, player.dir, x, y);
	result.elevation = Math.atan((player.height - z) / distToWall);
	
	return result;
}

/**
 * The elevation angle returned by worldCoordsToViewAngles()
 * is not useful when the point in question is out of the
 * player's view (that is, azimuth is greater than half the FOV).
 * Given a view angle structure, this function checks if the
 * original point is in view based on the azimuth angle. If not,
 * it calls worldCoordsToViewAngles() again, this time on the
 * part of the wall that is right at the edge of the player's view.
 * This guarantees the correct elevation angle will be used.
 */
function correctOutOfViewAngles(viewAngles, wall, z)
{
	if (flags.wallEndpointCorrection > 0 && Math.abs(viewAngles.azimuth) > player.fov / 2)
	{
		// Get the angle of the edge of the player's vision, on the side of the player
		// that this wall point is.
		var fovdir = player.dir + (player.fov / 2) * (viewAngles.azimuth > 0 ? 1 : -1);

		// Calculate where the line that scrapes the edge of the player's vision meets
		// the wall. Then, calculate the azimuth angle from the center of the player's
		// vision to that point on the wall.
		var wallpoint = intersectLineAngle(player.x, player.y, fovdir, wall.x1, wall.y1, wall.x2, wall.y2);
		
		if (wallpoint == null)
			return viewAngles;
		
		var wallpoint_azimuth = azimuthAngle(player.x, player.y, player.dir, wallpoint.x, wallpoint.y);
	
		// If the azimuth is greater than it should be, we used the wrong side of the
		// player's vision. Re-calculate using the other side. Note: we divide by 1.999
		// instead of 2 here because floats aren't that sick.
		if (flags.wallEndpointCorrection == 2 && Math.abs(wallpoint_azimuth) > player.fov / 1.999)
		{
			fovdir = player.dir + (player.fov / 2) * (viewAngles.azimuth > 0 ? -1 : 1);
			wallpoint = intersectLineAngle(player.x, player.y, fovdir, wall.x1, wall.y1, wall.x2, wall.y2);
		}
		
		if (wallpoint == null)
			return viewAngles;

		return worldCoordsToViewAngles(wallpoint.x, wallpoint.y, z);
	}
	
	return viewAngles;
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

// ***************************************
//           HELPER FUNCTIONS
// ***************************************

/**
 * Basic Pythagorean distance between two points.
 */
function distPoints(x1, y1, x2, y2)
{
	return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}

/**
 * Returns the distance to a point from a position, given a
 * particular view angle. For example, if the player is facing
 * directly to the right, this would return Abs(wx - px) (and not
 * account for Y positions of points at all). This function does
 * a similar calculation but for any direction.
 */
function distPointsInDirection(px, py, pdir, wx, wy)
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
 * in point-slope form. Slopes are given as actual slopes, not angles.
 * Returns an {x, y} JSON structure.
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
 * Returns an {x, y} JSON structure.
 */
function intersectLineVertical(x1, y1, m1, x2)
{
	return {x: x2, y: m1 * (x2 - x1) + y1};
}

/**
 * Gets the point where a line (defined by two points) intersects
 * with a line extended from a point and angle. This will extend
 * both lines indefinitely. Returns an {x, y} JSON structure.
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

function azimuthAngle(px, py, pdir, x, y)
{
	var abs_angle = Math.atan2(py - y, px - x) + PI;
	return Math.atan2(Math.sin(abs_angle - pdir), Math.cos(abs_angle - pdir));
}