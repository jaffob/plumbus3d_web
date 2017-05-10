// Gameplay constants.
var FPS = 60;
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
	draw();
}

function handleInput()
{
	var df = player.vf * (1/FPS);
	var dr = player.vr * (1/FPS);
	
	// Rotation.
	if (input_left) player.dir -= dr;
	if (input_right) player.dir += dr;
	
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

function draw()
{
	draw2d("canvas2d");
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