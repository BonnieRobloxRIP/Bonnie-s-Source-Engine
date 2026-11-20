// Every room in the game. To add a room: create its file in definitions/, import it here and add it to the right list.
// Rooms are picked at random from their list. Set `enabled: false` in a room file to take it out of rotation,
// or `in_endless: false` to keep it out of Endless mode only.

import { validateRooms } from "./engine/validate.js";

import easy_r1_ruined_bridge from "./definitions/easy/r1_ruined_bridge.js";
import easy_r1_strange_warehouse from "./definitions/easy/r1_strange_warehouse.js";
import easy_r1_storage_low from "./definitions/easy/r1_storage_low.js";
import easy_r1_alternative_way from "./definitions/easy/r1_alternative_way.js";
import easy_r1_cb_box_trot from "./definitions/easy/r1_cb_box_trot.js";
import easy_r1_cb_power_failure from "./definitions/easy/r1_cb_power_failure.js";
import easy_r1_cb_side_floors from "./definitions/easy/r1_cb_side_floors.js";
import easy_r1_cb_thin_glass from "./definitions/easy/r1_cb_thin_glass.js";
import easy_r1_cb_warehouse from "./definitions/easy/r1_cb_warehouse.js";
import easy_r2_jump_up from "./definitions/easy/r2_jump_up.js";
import easy_r2_limited_time from "./definitions/easy/r2_limited_time.js";
import easy_r2_mazed_warehouse from "./definitions/easy/r2_mazed_warehouse.js";
import easy_r2_extra_buttons from "./definitions/easy/r2_extra_buttons.js";
import easy_r3_the_wall from "./definitions/easy/r3_the_wall.js";
import easy_r3_absurd_pipeline from "./definitions/easy/r3_absurd_pipeline.js";
import easy_r3_power_core from "./definitions/easy/r3_power_core.js";
import easy_r3_wooden_highground from "./definitions/easy/r3_wooden_highground.js";
import easy_exit_code_room from "./definitions/easy/exit_code_room.js";
import easy_finale_almost_there from "./definitions/easy/finale_almost_there.js";
import medium_r1_stone_platforms from "./definitions/medium/r1_stone_platforms.js";
import medium_r1_plenty_of_space from "./definitions/medium/r1_plenty_of_space.js";
import medium_r1_dusty_bridges from "./definitions/medium/r1_dusty_bridges.js";
import medium_r2_confusing_lines from "./definitions/medium/r2_confusing_lines.js";
import medium_r2_advanced_tech from "./definitions/medium/r2_advanced_tech.js";
import medium_r2_mechanical_bridges from "./definitions/medium/r2_mechanical_bridges.js";
import medium_r3_labyrinth from "./definitions/medium/r3_labyrinth.js";
import medium_r3_better_chances from "./definitions/medium/r3_better_chances.js";
import medium_r3_electric_tower from "./definitions/medium/r3_electric_tower.js";
import hard_r1_trapped from "./definitions/hard/r1_trapped.js";
import hard_r1_interesting_paths from "./definitions/hard/r1_interesting_paths.js";
import hard_r2_ventilation_failure from "./definitions/hard/r2_ventilation_failure.js";
import hard_r2_broken_system from "./definitions/hard/r2_broken_system.js";
import hard_r3_master_lift from "./definitions/hard/r3_master_lift.js";
import hard_r3_tesla_power from "./definitions/hard/r3_tesla_power.js";

export const ROOMS = {
	easy: {
		r1: [easy_r1_ruined_bridge, easy_r1_strange_warehouse, easy_r1_storage_low, easy_r1_alternative_way, easy_r1_cb_box_trot, easy_r1_cb_power_failure, easy_r1_cb_side_floors, easy_r1_cb_thin_glass, easy_r1_cb_warehouse],
		r2: [easy_r2_jump_up, easy_r2_limited_time, easy_r2_mazed_warehouse, easy_r2_extra_buttons],
		r3: [easy_r3_the_wall, easy_r3_absurd_pipeline, easy_r3_power_core, easy_r3_wooden_highground],
		exit: [easy_exit_code_room],
		finale: [easy_finale_almost_there],
	},
	medium: {
		r1: [medium_r1_stone_platforms, medium_r1_plenty_of_space, medium_r1_dusty_bridges],
		r2: [medium_r2_confusing_lines, medium_r2_advanced_tech, medium_r2_mechanical_bridges],
		r3: [medium_r3_labyrinth, medium_r3_better_chances, medium_r3_electric_tower],
	},
	hard: {
		r1: [hard_r1_trapped, hard_r1_interesting_paths],
		r2: [hard_r2_ventilation_failure, hard_r2_broken_system],
		r3: [hard_r3_master_lift, hard_r3_tesla_power],
	},
};

validateRooms(ROOMS);
