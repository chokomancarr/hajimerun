//@ts-check
'use strict';

const C_W = 900;
const C_H = 300;

const SPEED_INC_START = 0;
const SPEED_INC = 0.005;
const SPEED_MAX = 4;

const GAME_STATE = Object.freeze({
    TITLE: 1,
    PLAY: 2,
    GAME_OVER: 3,
});
const PLAYER_STATE = Object.freeze({
    RUN: 1,
    JUMP: 2,
});

let game_info = {
    state: GAME_STATE.TITLE,
    score: 0,
    player_state: PLAYER_STATE.RUN,
    time_scale: 1,
};

const is_mobile = (function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
})();
const INPUT_NAME = is_mobile ? "TAP" : "Press SPACE";

/**
 * @param {string} url
 */
async function load_bitmap(url) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = () => resolve(
            createImageBitmap(img, 0, 0, img.width, img.height),
        );
        img.onerror = reject;
        img.src = url;
    })
}

class Sprite {
    /**
     * @param {ImageBitmap} img
     * @param {number} nx
     * @param {number} ny
     * @param {number} dt
     */
    constructor(img, nx, ny, dt) {
        this.img = img;
        this.nx = nx;
        this.ny = ny;
        this.dt = dt;
        this.dw = img.width / nx;
        this.dh = img.height / ny;
        this._t = 0;
        this.ix = 0;
        this.iy = 0;
        this.repeat = true;
        this.ended = false;
    }
    /**
     * @param {number} delta
     */
    advance(delta) {
        this._t += delta;
        while (this._t >= this.dt) {
            this._t -= this.dt;
            this.ix += 1;
            if (this.ix === this.nx) {
                this.ix = 0;
                this.iy += 1;
                if (this.iy === this.ny) {
                    if (this.repeat)
                        this.iy = 0;
                    else {
                        this.ended = true;
                    }
                }
            }
        }
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} dx
     * @param {number} dy
     * @param {number} sx
     * @param {number} sy
     */
    draw(ctx, dx, dy, sx, sy) {
        ctx.drawImage(this.img, this.dw * this.ix, this.dh * this.iy, this.dw, this.dh, dx, dy, sx, sy);
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} delta
     * @param {number} dx
     * @param {number} dy
     * @param {number} sx
     * @param {number} sy
     */
    draw_and_advance(ctx, dx, dy, sx, sy, delta) {
        this.draw(ctx, dx, dy, sx, sy);
        this.advance(delta);
    }
    reset() {
        this._t = 0;
        this.ix = 0;
        this.iy = 0;
        this.ended = false;
    }
}

class Floor {
    constructor() {
        this.floor_speed = 500;
        this.hole_prob = 0.2;
        this.hole_prob_mul = 0.3;
        this._pending = C_W;
        this._arr = [];
    }
    async load() {
        this.bmp_normal = new Sprite(await load_bitmap("res/floor_normal.png"), 1, 1, 1);
        this.bmp_cracked = new Sprite(await load_bitmap("res/floor_cracked.png"), 1, 1, 1);
        return this;
    }
    /**
     * @param {number} delta
     */
    advance(delta, hasholes = true) {
        let dx = this.floor_speed * delta;
        this._pending += dx;

        for (let i = 0; i < this._arr.length; i++) {
            let it = this._arr[i];
            it.x += dx;
            if (it.x > C_W) {
                this._arr.shift()
            }
        }

        let prob = this.hole_prob + (game_info.time_scale - 1) * this.hole_prob_mul;

        while (this._pending > 0) {
            let hole = hasholes && (Math.random() <= prob);
            this._pending -= hole ? 600 : 200;
            this._arr.push({
                img : hole ? this.bmp_cracked : this.bmp_normal,
                x : this._pending,
                ishole: hole
            });
        }
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        this._arr.forEach(it => {
            it.img.draw(ctx, it.x, 255, it.ishole ? 600 : 200, 60);
        });
    }
    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} delta
     */
    draw_and_advance(ctx, delta) {
        this.draw(ctx);
        this.advance(delta);
    }
    reset() {
        this._arr = [];
        this._pending = C_W;
        this.advance(0, false);
    }
    checkhit() {
        const p_a = 750;
        const p_b = 850;
        const f_a = 270;
        const f_b = 320;
        return this._arr.some(it => it.ishole &&
            (it.x + f_a < p_b) && (it.x + f_b > p_a)
        );
    }
}

(async function() {
    let canvas = document.querySelector("canvas");
    let ctx = canvas.getContext("2d");
    let t0 = 0;
    let game_t0 = 0;

    let player_running = new Sprite(await load_bitmap("res/run.png"), 4, 2, 0.1);
    let player_jumping = new Sprite(await load_bitmap("res/jump.png"), 4, 3, 0.07);
    player_jumping.repeat = false;

    let floor = await (new Floor()).load();

    let space_pressed = false;
    let space_pressed_next = false;

    document.addEventListener('keydown', e => {
        if (e.code === "Space") {
            space_pressed_next = true;
        }
    });
    document.addEventListener('touchstart', _ => {
        space_pressed_next = true;
    });

    function game_start() {
        game_info.state = GAME_STATE.PLAY;
        game_info.player_state = PLAYER_STATE.JUMP;
        game_info.score = 0;
        floor.reset();
        game_t0 = t0;
        player_jumping.reset();
    }

    function game_stop() {
        game_info.state = GAME_STATE.GAME_OVER;
        game_info.time_scale = 1;
    }

    /**
     * @param {DOMHighResTimeStamp} time
     */
    function loop(time) {
        let true_delta = (time - t0) * 0.001;
        let delta = true_delta * game_info.time_scale;
        t0 = time;

        if (space_pressed_next) {
            space_pressed_next = false;
            space_pressed = true;
        }
        else if (space_pressed) {
            space_pressed = false;
        }

        ctx.fillStyle = "rgb(175, 225, 227)";
        ctx.fillRect(0, 0, C_W, C_H);

        switch (game_info.state) {
            case GAME_STATE.TITLE: {
                ctx.fillStyle = "white";
                ctx.textAlign = 'center';
                ctx.font = "40px Courier new";
                ctx.fillText("HAJIME RUN!", 450, 100);
                if (time % 2000 > 1000) {
                    ctx.font = "20px Courier new";
                    ctx.fillText(INPUT_NAME + " to jump", 450, 200);
                }

                if (space_pressed) {
                    game_start();
                }
                break;
            }
            case GAME_STATE.PLAY: {
                if (t0 > SPEED_INC_START) {
                    game_info.time_scale = Math.min(game_info.time_scale + SPEED_INC * true_delta, SPEED_MAX);
                }

                game_info.score += delta * 100;

                floor.advance(delta * ((game_info.player_state === PLAYER_STATE.JUMP) ? 0.7 : 1));

                if (game_info.player_state == PLAYER_STATE.RUN) {
                    if (space_pressed) {
                        game_info.player_state = PLAYER_STATE.JUMP;
                        player_jumping.reset();
                    }
                }

                if (game_info.player_state !== PLAYER_STATE.JUMP && floor.checkhit()) {
                    game_stop();
                }
        
                switch (game_info.player_state) {
                    case PLAYER_STATE.JUMP: {
                        player_jumping.draw_and_advance(ctx, 570, 10, 332, 258, delta);
                        if (player_jumping.ended) {
                            game_info.player_state = PLAYER_STATE.RUN;
                            player_running.reset();
                        }
                        break;
                    }
                    case PLAYER_STATE.RUN: {
                        player_running.draw_and_advance(ctx, 700, 80, 200, 200, delta);
                        break;
                    }
                }
                floor.draw(ctx);
        
                ctx.fillStyle = "white";
                ctx.font = "30px Courier new";
                ctx.textAlign = 'left';
                ctx.fillText(Math.floor(game_info.score).toString().padStart(10, "0"), 20, 40);
                break;
            }
            case GAME_STATE.GAME_OVER: {
                ctx.fillStyle = "white";
                ctx.font = "50px Courier new";
                ctx.textAlign = 'center';
                ctx.fillText("GAME OVER", 450, 100);
                ctx.font = "20px Courier new";

                ctx.fillText("SCORE: " + Math.floor(game_info.score).toString().padStart(10, "0"), 450, 150);
                if (time % 2000 > 1000) {
                    ctx.fillText(INPUT_NAME + " to return", 450, 200);
                }
        
                player_running.draw(ctx, 700, 80, 200, 200);
                floor.draw(ctx);
                
                if (space_pressed) {
                    game_info.state = GAME_STATE.TITLE;
                }
                break;
            }
        }

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
})()