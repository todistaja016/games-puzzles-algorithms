(function() {

'use strict';

var frame_width = 1000;
var frame_height = 600;
var board_width = 1000 - 10;
var board_height = frame_height - 60;

var game = new Phaser.Game(frame_width, frame_height, Phaser.Auto, "body",
                           {preload: preload, create: create,});

var size = 50;
var diameter = 60;
var height = 2 * size;
var width = Math.sqrt(3)/2 * height;
var board_colors = [0x000000, 0xffffff];
var row_dimension;
var column_dimension;

var BLACK = 0;
var WHITE = 1;
var EMPTY = 2;

var board;
var border;
var border_hexagons;
var play_hexagons;
var border_graphics;
var play_graphics;

// Generate a hexagon centered at the given center point.
function hexagon(center) {
    var point = center.clone();
    var corners = [];

    point.add(0, size);
    corners.push(point.clone());

    for (var i = 0; i < 5; ++i) {
        point.rotate(center.x, center.y, 60, true);
        corners.push(point.clone());
    }

    return new Phaser.Polygon(corners);
}

// Generate one column of the board.
function generate_column(start, row_dimension) {
    var center = start.clone();
    var hexagons = [];

    for (var i = 0; i < row_dimension; ++i) {
        hexagons.push(hexagon(center));
        center.add(width / 2, 3/4 * height);
    }

    return hexagons;
}

//Generate one row of the board.
function generate_row(start, column_dimension) {
    var center = start.clone();
    var hexagons = [];

    for (var i = 0; i < column_dimension; ++i) {
        hexagons.push(hexagon(center));
        center.add(width, 0);
    }

    return hexagons;
}

// Generate the hexagons that make up the board.
function generate_board(row_dimension, column_dimension) {
    var hexagons = [];

    var column_start = new Phaser.Point(1.5 * width, 1.5 * height);

    for (var i = 0; i < column_dimension; ++i) {
        Array.prototype.push.apply(hexagons,
                                   generate_column(column_start, row_dimension));
        column_start.add(width, 0);
    }

    return hexagons;
}

// Generate the hexagons that will make up the board border.
function generate_border(row_dimension, column_dimension) {
    var column_start, row_start, i;
    var hexagons = [];
    border = [];

    // Add column along left.
    column_start = new Phaser.Point(width, 2.25 * height);
    Array.prototype.push.apply(hexagons, generate_column(column_start,
                                                         row_dimension - 1));

    // Add column along right.
    column_start = new Phaser.Point((column_dimension + 1.5) * width,
                                    1.5 * height);
    Array.prototype.push.apply(hexagons, generate_column(column_start,
                                                         row_dimension - 1));

    // Push white pieces into border.
    for (i = 0; i < 2 * (row_dimension - 1); ++i) {
        border.push(WHITE);
    }

    // Add row along top.
    row_start = new Phaser.Point(2 * width, 0.75 * height);
    Array.prototype.push.apply(hexagons, generate_row(row_start,
                                                      column_dimension - 1));

    // Add row along bottom.
    row_start = new Phaser.Point((0.5 * (row_dimension + 1) + 1) * width,
                                 (0.75 * row_dimension + 1.5) * height);
    Array.prototype.push.apply(hexagons, generate_row(row_start,
                                                      column_dimension - 1));

    // Push black pieces into border.
    for (i = 0; i < 2 * (column_dimension - 1); ++i) {
        border.push(BLACK);
    }

    return hexagons;
}

// Calculate the maximum unit size based on board frame height.
function max_size_height(row_dimension, board_height) {
    var height_multiple = 2 + (3 / 4) * (row_dimension - 1);
    return board_height / height_multiple / 2;
}

// Calculate the maximum unit size based on board frame width.
function max_size_width(row_dimension, column_dimension, board_width) {
    var width_multiple = 2 + column_dimension + (row_dimension - 1) / 2;
    return board_width / width_multiple / Math.sqrt(3);
}

function set_dimensions(size) {
    diameter = 1.2 * size;
    height = 2 * size;
    width = Math.sqrt(3)/2 * height;
}

// Set the size of the board units.
function set_size(row_dimension, column_dimension) {
    var from_height = max_size_height(row_dimension + 2, board_height);
    var from_width = max_size_width(row_dimension + 2, column_dimension + 2,
                                    board_width);

    if (from_height < from_width) {
        size = from_height;
    } else {
        size = from_width;
    }

    set_dimensions(size);
}

function initialize_board(row_dimension, column_dimension) {
    set_size(row_dimension, column_dimension);
    play_hexagons = generate_board(row_dimension, column_dimension);
    border_hexagons = generate_border(row_dimension, column_dimension);
}

// Calculate the center of mass of the given polygon.
function poly_center(poly) {
    var coords = poly.toNumberArray();

    var x = 0.0;
    var y = 0.0;

    for (var i = 0; i < coords.length / 2; ++i) {
        x += coords[2 * i];
        y += coords[2 * i + 1];
    }

    x /= coords.length / 2;
    y /= coords.length / 2;

    return [x, y];
}

// Draw a piece within the given hexagon, if needed.
function draw_piece(hexagon, piece, graphics) {
    if (piece == EMPTY) {
        return;
    }

    var center = poly_center(hexagon);

    graphics.beginFill(board_colors[piece]);
    graphics.drawCircle(center[0], center[1], diameter);
    graphics.endFill();
}

function draw_play_area(hexagons, graphics) {
    graphics.clear();
    graphics.lineStyle(2, 0x000000, 1);

    for (var i = 0; i < hexagons.length; ++i) {
        graphics.beginFill(0xffffff, 0);
        graphics.drawPolygon(hexagons[i]);
        draw_piece(hexagons[i], board[i], graphics);
        graphics.endFill();
    }
}

function draw_border(hexagons, graphics) {
    graphics.clear();
    graphics.lineStyle(2, 0x000000, 1);

    for (var i = 0; i < hexagons.length; ++i) {
        graphics.beginFill(0xffffff, 0);
        graphics.drawPolygon(hexagons[i]);
        draw_piece(hexagons[i], border[i], graphics);
        graphics.endFill();
    }
}

function draw_board(play_hexagons, border_hexagons, play_graphics,
                    border_graphics) {
    draw_play_area(play_hexagons, play_graphics);
    draw_border(border_hexagons, border_graphics);
}

function declare_winner(winner) {
    var win_string;
    if (winner === BLACK) {
        win_string = "Black wins!";
    } else if (winner === WHITE) {
        win_string = "White wins!";
    }

    $("#who_wins").html(win_string);
    $("#winner_modal").modal('show');
}

function set_board(data) {
    if (data.error === true) {
        return;
    }
    board = data.board;
    draw_play_area(play_hexagons, play_graphics);

    if (typeof data.winner !== 'undefined' && data.winner !== 2) {
        declare_winner(data.winner);
    }
}

function reset_board(data) {
    if (data.error === true) {
        return;
    }
    row_dimension = data.row_dimension;
    column_dimension = data.column_dimension;
    initialize_board(row_dimension, column_dimension);
    draw_border(border_hexagons, border_graphics);
    get_state();
}

function get_state() {
    $.ajax({ url: $SCRIPT_ROOT + '/_board',
             dataType: 'json',
             async: false,
             data: {},
             success: set_board
           });
}

function make_move(row, column) {
    $.ajax({ url: $SCRIPT_ROOT + '/_play_move',
             dataType: 'json',
             async: false,
             data: {'row': row,
                    'column': column},
             success: set_board
           });
}

function board_index(row, column) {
    return (column * row_dimension + row);
}

// Check if we've clicked on a hex and request a move if appropriate.
function on_click(key) {
    for (var i = 0; i < column_dimension; ++i) {
        for (var j = 0; j < row_dimension; ++j) {
            var hex = play_hexagons[board_index(j, i)];
            if (hex.contains(this.input.x, this.input.y)) {
                make_move(j, i);
                break;
            }
        }
    }
}

function undo_move() {
    $.ajax({ url: $SCRIPT_ROOT + '/_undo_move',
             dataType: 'json',
             async: false,
             data: {},
             success: set_board
           });
}

function reset_game() {
    $.ajax({ url: $SCRIPT_ROOT + '/_reset_game',
             dataType: 'json',
             async: false,
             data: {},
             success: reset_board
           });
}

function ai_move() {
    $.ajax({ url: $SCRIPT_ROOT + '/_ai_move',
             dataType: 'json',
             async: false,
             data: {},
             success: set_board
           });
}

function resize_board() {
    var $form = $('.ui.form');
    var row_dimension = $form.form('get value', 'row_dimension');
    var column_dimension = $form.form('get value', 'column_dimension');

    $('#resize_modal').modal('hide');

    $.ajax({ url: $SCRIPT_ROOT + '/_resize_board',
             dataType: 'json',
             async: false,
             data: {'row_dimension': row_dimension,
                    'column_dimension': column_dimension},
             success: reset_board
           });

    return false;
}

function resize_board_modal() {
    var prompt_string = "Please enter a number in the range [2:13].";
    $('.ui.form')
        .form({
            fields: {
                row_dimension: {
                    identifier : 'row_dimension',
                    rules: [
                        {
                            type : 'integer[1..13]',
                            prompt: prompt_string
                        }
                    ]
                },
                column_dimension: {
                    identifier : 'column_dimension',
                    rules: [
                        {
                            type : 'integer[1..13]',
                            prompt: prompt_string
                        }
                    ]
                }
            },
            onSuccess: resize_board
        });
    var modal_element = $('#resize_modal').modal('setting', {
        onApprove: resize_board
    });
    modal_element.modal('show');
}

function set_agent(text, value)  {
    $('#agent_modal').modal('hide');
    $('.ui.dropdown').dropdown('hide');

    $.ajax({ url: $SCRIPT_ROOT + '/_select_agent',
             dataType: 'json',
             async: false,
             data: {'agent': text},
           });

    return false;
}

function agent_selection_modal() {
    $('#agent_modal').modal('show');
    $('.ui.dropdown').dropdown({
        action: set_agent
    });
}

function show_tree() {
    window.open('/tree_view');
}

function preload() {
    // Set the game to scale automatically.
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;

    // Load the image assets.
    game.load.image('undo', $SCRIPT_ROOT + '/static/assets/undo.png');
    game.load.image('reset', $SCRIPT_ROOT + '/static/assets/reset.png');
    game.load.image('aimove', $SCRIPT_ROOT + '/static/assets/aimove.png');
    game.load.image('resize', $SCRIPT_ROOT + '/static/assets/resize.png');
    game.load.image('agent', $SCRIPT_ROOT + '/static/assets/agent.png');
    game.load.image('wood', $SCRIPT_ROOT + '/static/assets/wood.jpg');
    game.load.image('tree', $SCRIPT_ROOT + '/static/assets/tree.png');
}

function create() {
    game.stage.backgroundColor = 0xffffff;

    game.add.image(0, 0, 'wood');
    play_graphics = game.add.graphics(0, 0);
    border_graphics = game.add.graphics(0, 0);

    game.add.button(10, 550, 'undo', undo_move);
    game.add.button(180, 550, 'reset', reset_game);
    game.add.button(350, 550, 'aimove', ai_move);
    game.add.button(520, 550, 'resize', resize_board_modal);
    game.add.button(690, 550, 'agent', agent_selection_modal);
    game.add.button(850, 550, 'tree', show_tree);

    reset_game();
    draw_board(play_hexagons, border_hexagons, play_graphics, border_graphics);

    game.input.onDown.add(on_click, game);
}

})();
