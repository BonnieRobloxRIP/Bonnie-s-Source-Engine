# = SYSTEM RUN =
# - Open entrance door -
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 11 if score r2_timer_ms hard matches 1 run structure load "hard:HardTunnelDoor2" ~8 ~2 ~3 90_degrees
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 11 if score r2_timer_ms hard matches 10 run structure load "hard:HardTunnelDoor3" ~8 ~2 ~3 90_degrees
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 11 if score r2_timer_ms hard matches 10 run playsound sfx.doors.tunnelopen @a[tag=hard] ~8 ~3 ~3.5
# - Level title -
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score r2_timer_s hard matches 11 if score r2_timer_ms hard matches 10 if score started2 hard matches 1 run title @a[tag=hard] subtitle §4Broken System
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score r2_timer_s hard matches 11 if score r2_timer_ms hard matches 10 if score started2 hard matches 1 run title @a[tag=hard] title §4§lROOM 2
# - Test for buttons -
# // Button 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B1 hard matches 0 if block ^3 ^4 ^-2 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R2B1a hard 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B1 hard matches 0 if score R2B1a hard matches 1 run setblock ~3 ~1 ~-1 lever["lever_direction"="down_east_west", "open_bit"=true]
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B1 hard matches 0 if score R2B1a hard matches 1 run structure load "hard/room2/2_broken_system:HMR2V2M1" ^-1 ^2 ^6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B1 hard matches 0 if score R2B1a hard matches 5 run playsound tile.piston.out @a[tag=hard] ~5 ~2 ~6
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B1 hard matches 0 if score R2B1a hard matches 10 run playsound tile.piston.out @a[tag=hard] ~3 ~3 ~6
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B1 hard matches 0 if score R2B1a hard matches 15 run playsound tile.piston.out @a[tag=hard] ~1 ~4 ~6
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B1 hard matches 0 if score R2B1a hard matches 20 run playsound tile.piston.out @a[tag=hard] ~-1 ~5 ~6
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B1 hard matches 0 if score R2B1a hard matches 20.. run scoreboard players set R2B1 hard 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B1 hard matches 1 if score R2B1a hard matches 20.. run scoreboard players reset R2B1a hard
# // Button 2 call
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if block ^3 ^9 ^-5 brr:flood_button["brr:button_type"="mechanical","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players add R2B2a hard 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 5 run playsound sfx.elevator.platform.start @a[tag=hard]
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 30 run stopsound @a[tag=hard] sfx.elevator.platform.start
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 30 run playsound sfx.elevator.platform.stop @a[tag=hard]
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 1 run tellraw @a[tag=hard] {"rawtext":[{"text": "§4§lALERT: §r§4Lift Called!"}]}
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 5 run structure load "hard/room2/2_broken_system:HMR2V2M2" ^-5 ^21 ^-6
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 10 run structure load "hard/room2/2_broken_system:HMR2V2M2" ^-4 ^21 ^-6
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 15 run structure load "hard/room2/2_broken_system:HMR2V2M2" ^-3 ^21 ^-6
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 20 run structure load "hard/room2/2_broken_system:HMR2V2M2" ^-2 ^21 ^-6
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 25 run structure load "hard/room2/2_broken_system:HMR2V2M2" ^-1 ^21 ^-6
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 30 run structure load "hard/room2/2_broken_system:HMR2V2M2" ^ ^21 ^-6
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 5 run structure load "hard/room2/2_broken_system:HMR2V2M2b" ^-5 ^8 ^1
execute as @s[type=brr:flood_room, name=hard_room2] at @s positioned ~-5 ~9 ~1 as @a[tag=hard, dx=9, dy=9, dz=4] if score R2B2 hard matches 0 if score R2B2a hard matches 5 run function game_functions/mode_hard/extra/r2_2_broken_system/player_tp
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 10 run structure load "hard/room2/2_broken_system:HMR2V2M2c" ^-5 ^8 ^1
execute as @s[type=brr:flood_room, name=hard_room2] at @s positioned ~-5 ~9 ~1 as @a[tag=hard, dx=9, dy=9, dz=4] if score R2B2 hard matches 0 if score R2B2a hard matches 10 run function game_functions/mode_hard/extra/r2_2_broken_system/player_tp
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 15 run structure load "hard/room2/2_broken_system:HMR2V2M2d" ^-5 ^8 ^1
execute as @s[type=brr:flood_room, name=hard_room2] at @s positioned ~-5 ~9 ~1 as @a[tag=hard, dx=9, dy=9, dz=4] if score R2B2 hard matches 0 if score R2B2a hard matches 15 run function game_functions/mode_hard/extra/r2_2_broken_system/player_tp
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 20 run structure load "hard/room2/2_broken_system:HMR2V2M2e" ^-5 ^8 ^1
execute as @s[type=brr:flood_room, name=hard_room2] at @s positioned ~-5 ~9 ~1 as @a[tag=hard, dx=9, dy=9, dz=4] if score R2B2 hard matches 0 if score R2B2a hard matches 20 run function game_functions/mode_hard/extra/r2_2_broken_system/player_tp
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 25 run structure load "hard/room2/2_broken_system:HMR2V2M2f" ^-5 ^8 ^1
execute as @s[type=brr:flood_room, name=hard_room2] at @s positioned ~-5 ~9 ~1 as @a[tag=hard, dx=9, dy=9, dz=4] if score R2B2 hard matches 0 if score R2B2a hard matches 25 run function game_functions/mode_hard/extra/r2_2_broken_system/player_tp
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 30 run structure load "hard/room2/2_broken_system:HMR2V2M2g" ^-5 ^8 ^1
execute as @s[type=brr:flood_room, name=hard_room2] at @s positioned ~-5 ~9 ~1 as @a[tag=hard, dx=9, dy=9, dz=4] if score R2B2 hard matches 0 if score R2B2a hard matches 30 run function game_functions/mode_hard/extra/r2_2_broken_system/player_tp
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 40.. run setblock ^3 ^9 ^-5 brr:flood_button["brr:button_type"="mechanical","brr:pressed"=false, "minecraft:block_face"="south"]
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 40.. run scoreboard players set R2B2 hard 2
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 2 if score R2B2a hard matches 40.. run scoreboard players reset R2B2a hard
# // Button 2 send
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 2 if block ^3 ^9 ^-5 brr:flood_button["brr:button_type"="mechanical","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players set R2B2 hard 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if block ^3 ^9 ^-5 brr:flood_button["brr:button_type"="mechanical","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players add R2B2a hard 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 61 run playsound sfx.elevator.platform.start @a[tag=hard]
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 86 run stopsound @a[tag=hard] sfx.elevator.platform.start
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 86 run playsound sfx.elevator.platform.stop @a[tag=hard]
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 1 run tellraw @a[tag=hard] {"rawtext":[{"text": "§4§lALERT: §r§4Lift will rise in.. §l3"}]}
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 21 run tellraw @a[tag=hard] {"rawtext":[{"text": "§4§lALERT: §r§4Lift will rise in.. §l2"}]}
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 41 run tellraw @a[tag=hard] {"rawtext":[{"text": "§4§lALERT: §r§4Lift will rise in.. §l1"}]}
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 61 run structure load "hard/room2/2_broken_system:HMR2V2M2" ^-1 ^21 ^-6
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 66 run structure load "hard/room2/2_broken_system:HMR2V2M2" ^-2 ^21 ^-6
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 71 run structure load "hard/room2/2_broken_system:HMR2V2M2" ^-3 ^21 ^-6
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 76 run structure load "hard/room2/2_broken_system:HMR2V2M2" ^-4 ^21 ^-6
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 81 run structure load "hard/room2/2_broken_system:HMR2V2M2" ^-5 ^21 ^-6
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 86 run structure load "hard/room2/2_broken_system:HMR2V2M2" ^-6 ^21 ^-6
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 61 run structure load "hard/room2/2_broken_system:HMR2V2M2f" ^-5 ^8 ^1
execute as @s[type=brr:flood_room, name=hard_room2] at @s positioned ~-5 ~9 ~1 as @a[tag=hard, dx=9, dy=9, dz=4] if score R2B2 hard matches 1 if score R2B2a hard matches 61 run function game_functions/mode_hard/extra/r2_2_broken_system/player_tp
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 66 run structure load "hard/room2/2_broken_system:HMR2V2M2e" ^-5 ^8 ^1
execute as @s[type=brr:flood_room, name=hard_room2] at @s positioned ~-5 ~9 ~1 as @a[tag=hard, dx=9, dy=9, dz=4] if score R2B2 hard matches 1 if score R2B2a hard matches 66 run function game_functions/mode_hard/extra/r2_2_broken_system/player_tp
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 71 run structure load "hard/room2/2_broken_system:HMR2V2M2d" ^-5 ^8 ^1
execute as @s[type=brr:flood_room, name=hard_room2] at @s positioned ~-5 ~9 ~1 as @a[tag=hard, dx=9, dy=9, dz=4] if score R2B2 hard matches 1 if score R2B2a hard matches 71 run function game_functions/mode_hard/extra/r2_2_broken_system/player_tp
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 76 run structure load "hard/room2/2_broken_system:HMR2V2M2c" ^-5 ^8 ^1
execute as @s[type=brr:flood_room, name=hard_room2] at @s positioned ~-5 ~9 ~1 as @a[tag=hard, dx=9, dy=9, dz=4] if score R2B2 hard matches 1 if score R2B2a hard matches 76 run function game_functions/mode_hard/extra/r2_2_broken_system/player_tp
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 81 run structure load "hard/room2/2_broken_system:HMR2V2M2b" ^-5 ^8 ^1
execute as @s[type=brr:flood_room, name=hard_room2] at @s positioned ~-5 ~9 ~1 as @a[tag=hard, dx=9, dy=9, dz=4] if score R2B2 hard matches 1 if score R2B2a hard matches 81 run function game_functions/mode_hard/extra/r2_2_broken_system/player_tp
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 86 run structure load "hard/room2/2_broken_system:HMR2V2M2a" ^-5 ^8 ^1
execute as @s[type=brr:flood_room, name=hard_room2] at @s positioned ~-5 ~9 ~1 as @a[tag=hard, dx=9, dy=9, dz=4] if score R2B2 hard matches 1 if score R2B2a hard matches 86 run function game_functions/mode_hard/extra/r2_2_broken_system/player_tp
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 95.. run setblock ^3 ^9 ^-5 brr:flood_button["brr:button_type"="mechanical","brr:pressed"=false, "minecraft:block_face"="south"]
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 95.. run scoreboard players set R2B2 hard 0
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 95.. run scoreboard players reset R2B2a hard
# // Exit Button
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B3 hard matches 0 if block ^6 ^18 ^-4 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R2B3a hard 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B3 hard matches 0 if score R2B3a hard matches 1 run fill ^-7 ^19 ^3 ^-7 ^19 ^4 air
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B3 hard matches 0 if score R2B3a hard matches 10 run fill ^-7 ^20 ^3 ^-7 ^20 ^4 air
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B3 hard matches 0 if score R2B3a hard matches 10 run tellraw @a[tag=hard] {"rawtext":[{"text": "§4Tunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B3 hard matches 0 if score R2B3a hard matches 10.. run scoreboard players set R2B3 hard 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B3 hard matches 1 if score R2B3a hard matches 10.. run scoreboard players reset R2B3a hard
# // - Flooding -
execute if score started2 hard matches 1 if score p_game hard matches 1.. if score r2_end hard matches 0 run scoreboard players add r2_timer_ms hard 1
execute if score r2_timer_ms hard matches 20.. run scoreboard players remove r2_timer_s hard 1
execute if score r2_timer_ms hard matches 20.. run scoreboard players set r2_timer_ms hard 0
execute if score r2_timer_s hard matches ..0 run scoreboard players add flood2 hard 1
# // flood part
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 1 if score r2_timer_s hard matches 3 if score r2_timer_ms hard matches 0 run playsound sfx.doors.opened @a[tag=hard] ~8 ~3 ~3.5 1 0.7
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 1 if score r2_timer_s hard matches 3 if score r2_timer_ms hard matches 0 run structure load "hard:HardTunnelDoor2" ~8 ~2 ~3 90_degrees
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 1 if score r2_timer_s hard matches 3 if score r2_timer_ms hard matches 5 run structure load "hard:HardTunnelDoor1" ~8 ~2 ~3 90_degrees
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 1 if score r2_timer_s hard matches 3 if score r2_timer_ms hard matches 5 run structure load "easy:NuhUh" ~9 ~2 ~3 90_degrees
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 1 if score r2_timer_s hard matches 0 run tellraw @a[tag=hard] {"rawtext":[{"text":"§3Water is r§kis§r§3ing§k!"}]}
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 1 if score r2_timer_s hard matches 0 run structure load "hard/room2/2_broken_system:HMR2V2F1" ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 2 if score r2_timer_s hard matches 0 run structure load "hard/room2/2_broken_system:HMR2V2F2" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 3 if score r2_timer_s hard matches 0 run structure load "hard/room2/2_broken_system:HMR2V2F3" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 4 if score r2_timer_s hard matches 0 run structure load "hard/room2/2_broken_system:HMR2V2F4" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 5 if score r2_timer_s hard matches 0 run structure load "hard/room2/2_broken_system:HMR2V2F5" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 6 if score r2_timer_s hard matches 0 run structure load "hard/room2/2_broken_system:HMR2V2F6" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 7 if score r2_timer_s hard matches 0 run structure load "hard/room2/2_broken_system:HMR2V2F7" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 8 if score r2_timer_s hard matches 0 run structure load "hard/room2/2_broken_system:HMR2V2F8" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 9 if score r2_timer_s hard matches 0 run structure load "hard/room2/2_broken_system:HMR2V2F9" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 10 if score r2_timer_s hard matches 0 run structure load "hard/room2/2_broken_system:HMR2V2F10" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 11 if score r2_timer_s hard matches 0 run structure load "hard/room2/2_broken_system:HMR2V2F11" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 12 if score r2_timer_s hard matches 0 run structure load "hard/room2/2_broken_system:HMR2V2F12" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 13 if score r2_timer_s hard matches 0 run structure load "hard/room2/2_broken_system:HMR2V2F13" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 14 if score r2_timer_s hard matches 0 run structure load "hard/room2/2_broken_system:HMR2V2F14" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 15 if score r2_timer_s hard matches 0 run structure load "hard/room2/2_broken_system:HMR2V2F15" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 16 if score r2_timer_s hard matches 0 run structure load "hard/room2/2_broken_system:HMR2V2F16" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 17 if score r2_timer_s hard matches 0 run structure load "hard/room2/2_broken_system:HMR2V2F17" ~-6 ~18 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 18 if score r2_timer_s hard matches 0 run structure load "hard/room2/2_broken_system:HMR2V2F18" ~-6 ~19 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score r2_timer_s hard matches ..0 run scoreboard players set r2_timer_s hard 3
execute if score flood2 hard matches 18 if score r2_timer_ms hard matches 10 run scoreboard players set r2_end hard 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=hard_room2] at @s run tag @a[tag=hard, x=~-14, y=~19, z=~3, dx=4, dy=1, dz=1] add hardtunnel2
execute as @s[type=brr:flood_room, name=hard_room2] at @s run tag @a[tag=hard, x=~-7, y=~19, z=~3, dx=0, dy=1, dz=1] remove hardtunnel2
# // exit player count
scoreboard players set p_tunnel2 hard 0
execute as @a[tag=hardtunnel2] at @s run scoreboard players add p_tunnel2 hard 1
# // transition into room 3
execute if score p_tunnel2 hard = p_game hard if score started3 hard matches 0 run scoreboard players set r2_end hard 1
execute if score r2_end hard matches 1 run scoreboard players add r2_transition hard 1
execute if score r2_transition hard matches 1 as @s[type=brr:flood_room, name=hard_room2] at @s run playsound sfx.doors.opened @a[tag=hard] ~-8 ~19 ~3.5 1 0.7
execute if score r2_transition hard matches 1 as @s[type=brr:flood_room, name=hard_room2] at @s run structure load "hard:HardTunnelDoor2" ~-8 ~19 ~3 90_degrees
execute if score r2_transition hard matches 10 as @s[type=brr:flood_room, name=hard_room2] at @s run structure load "hard:HardTunnelDoor1" ~-8 ~19 ~3 90_degrees
execute if score r2_transition hard matches 10 as @s[type=brr:flood_room, name=hard_room2] at @s positioned ~ ~2 ~ run fill ~-6 ~ ~-6 ~6 ~19 ~6 water
execute if score r2_transition hard matches 10 run scoreboard players set started3 hard 1
execute if score r2_transition hard matches 10.. run scoreboard players reset R2B1 hard
execute if score r2_transition hard matches 10.. run scoreboard players reset R2B2 hard
execute if score r2_transition hard matches 10.. run scoreboard players reset R2B3 hard
execute if score r2_transition hard matches 10.. run scoreboard players reset r2_timer_ms hard
execute if score r2_transition hard matches 10.. run scoreboard players reset r2_timer_s hard
execute if score r2_transition hard matches 10.. run scoreboard players reset r2_end hard
execute if score r2_transition hard matches 10.. run scoreboard players reset r2_transition hard