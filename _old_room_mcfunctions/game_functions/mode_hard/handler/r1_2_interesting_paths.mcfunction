# = SYSTEM RUN =
# - special extra time due to unfair room design -
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score started hard matches 1 if score r1_timer_s hard matches 11 if score r1_timer_ms hard matches 1 if score r1_extended hard matches 0 run scoreboard players set r1_timer_s hard 14
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score started hard matches 1 if score r1_timer_s hard matches 14 if score r1_timer_ms hard matches 1 if score r1_extended hard matches 0 run scoreboard players set r1_extended hard 1
# - Level title -
execute as @a[tag=hard] at @s if score r1_timer_s hard matches 11 if score r1_timer_ms hard matches 14 if score started hard matches 1 run title @a[tag=hard] subtitle §4Interesting Paths
execute as @a[tag=hard] at @s if score r1_timer_s hard matches 11 if score r1_timer_ms hard matches 14 if score started hard matches 1 run title @a[tag=hard] title §4§lROOM 1
execute as @a[tag=hard] at @s run tag @s add hard_music
# - Test for buttons -
# // Button 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B1 hard matches 0 if block ^6 ^3 ^-5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players add R1B1a hard 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B1 hard matches 0 if score R1B1a hard matches 1 run playsound sfx.doors.tunnelopen @a[tag=hard] ^2 ^3 ^-5.5
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B1 hard matches 0 if score R1B1a hard matches 1 run structure load "hard/room1/2_interesting_paths:HMR1V2M1" ^2 ^2 ^-6
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B1 hard matches 0 if score R1B1a hard matches 5 run structure load "hard/room1/2_interesting_paths:HMR1V2M1a" ^2 ^2 ^-6
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B1 hard matches 0 if score R1B1a hard matches 10 run structure load "hard/room1/2_interesting_paths:HMR1V2M1" ^-2 ^2 ^-6
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B1 hard matches 0 if score R1B1a hard matches 15 run structure load "hard/room1/2_interesting_paths:HMR1V2M1a" ^-2 ^2 ^-6
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B1 hard matches 0 if score R1B1a hard matches 15 run playsound sfx.doors.tunnelopen @a[tag=hard] ^-2 ^3 ^-5.5
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B1 hard matches 0 if score R1B1a hard matches 15.. run scoreboard players set R1B1 hard 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B1 hard matches 1 if score R1B1a hard matches 15.. run scoreboard players reset R1B1a hard
# // Button 2
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B2 hard matches 0 if block ^-5 ^3 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players add R1B2a hard 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B2 hard matches 0 if score R1B2a hard matches 1 run playsound sfx.doors.tunnelopen @a[tag=hard] ^-5.5 ^3 ^-2
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B2 hard matches 0 if score R1B2a hard matches 1 run structure load "hard/room1/2_interesting_paths:HMR1V2M1" ^-6 ^2 ^-2 90_degrees
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B2 hard matches 0 if score R1B2a hard matches 5 run structure load "hard/room1/2_interesting_paths:HMR1V2M1a" ^-6 ^2 ^-2 90_degrees
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B2 hard matches 0 if score R1B2a hard matches 10 run structure load "hard/room1/2_interesting_paths:HMR1V2M1" ^-6 ^2 ^2 90_degrees
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B2 hard matches 0 if score R1B2a hard matches 15 run structure load "hard/room1/2_interesting_paths:HMR1V2M1a" ^-6 ^2 ^2 90_degrees
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B2 hard matches 0 if score R1B2a hard matches 15 run playsound sfx.doors.tunnelopen @a[tag=hard] ^-5.5 ^3 ^2
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B2 hard matches 0 if score R1B2a hard matches 15.. run scoreboard players set R1B2 hard 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B2 hard matches 1 if score R1B2a hard matches 15.. run scoreboard players reset R1B2a hard
# // Button 3
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B3 hard matches 0 if block ^-6 ^3 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players add R1B3a hard 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B3 hard matches 0 if score R1B3a hard matches 1 run playsound sfx.doors.tunnelopen @a[tag=hard] ^-2 ^3 ^5.5
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B3 hard matches 0 if score R1B3a hard matches 1 run structure load "hard/room1/2_interesting_paths:HMR1V2M1" ^-2 ^2 ^5
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B3 hard matches 0 if score R1B3a hard matches 5 run structure load "hard/room1/2_interesting_paths:HMR1V2M1a" ^-2 ^2 ^5
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B3 hard matches 0 if score R1B3a hard matches 10 run structure load "hard/room1/2_interesting_paths:HMR1V2M1" ^2 ^2 ^5
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B3 hard matches 0 if score R1B3a hard matches 15 run structure load "hard/room1/2_interesting_paths:HMR1V2M1a" ^2 ^2 ^5
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B3 hard matches 0 if score R1B3a hard matches 15 run playsound sfx.doors.tunnelopen @a[tag=hard] ^2 ^3 ^5.5
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B3 hard matches 0 if score R1B3a hard matches 15.. run scoreboard players set R1B3 hard 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B3 hard matches 1 if score R1B3a hard matches 15.. run scoreboard players reset R1B3a hard
# // Button 4
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B4 hard matches 0 if block ^5 ^3 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players add R1B4a hard 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B4 hard matches 0 if score R1B4a hard matches 1 run playsound sfx.doors.tunnelopen @a[tag=hard] ^5.5 ^3 ^2
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B4 hard matches 0 if score R1B4a hard matches 1 run structure load "hard/room1/2_interesting_paths:HMR1V2M1" ^5 ^2 ^2 90_degrees
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B4 hard matches 0 if score R1B4a hard matches 5 run structure load "hard/room1/2_interesting_paths:HMR1V2M1a" ^5 ^2 ^2 90_degrees
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B4 hard matches 0 if score R1B4a hard matches 10 run structure load "hard/room1/2_interesting_paths:HMR1V2M3" ^-1 ^1 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B4 hard matches 0 if score R1B4a hard matches 13 run structure load "hard/room1/2_interesting_paths:HMR1V2M3a" ^-1 ^2 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B4 hard matches 0 if score R1B4a hard matches 16 run structure load "hard/room1/2_interesting_paths:HMR1V2M3b" ^-1 ^3 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B4 hard matches 0 if score R1B4a hard matches 19 run structure load "hard/room1/2_interesting_paths:HMR1V2M3c" ^-1 ^4 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B4 hard matches 0 if score R1B4a hard matches 21 run structure load "hard/room1/2_interesting_paths:HMR1V2M3d" ^-1 ^5 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B4 hard matches 0 if score R1B4a hard matches 10 run playsound sfx.elevator.lift @a[tag=hard]
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B4 hard matches 0 if score R1B4a hard matches 21 run playsound sfx.elevator.stop @a[tag=hard]
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B4 hard matches 0 if score R1B4a hard matches 21.. run scoreboard players set R1B4 hard 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B4 hard matches 1 if score R1B4a hard matches 21.. run scoreboard players reset R1B4a hard
# // Button 5
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B5 hard matches 0 if block ^6 ^8 ^-5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players add R1B5a hard 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B5 hard matches 0 if score R1B5a hard matches 1 run playsound sfx.doors.tunnelopen @a[tag=hard] ^5.5 ^7 ^-3
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B5 hard matches 0 if score R1B5a hard matches 1 run structure load "hard/room1/2_interesting_paths:HMR1V2M2" ^5 ^7 ^-3
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B5 hard matches 0 if score R1B5a hard matches 5 run structure load "hard/room1/2_interesting_paths:HMR1V2M2a" ^5 ^7 ^-3
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B5 hard matches 0 if score R1B5a hard matches 10 run structure load "hard/room1/2_interesting_paths:HMR1V2M3e" ^-1 ^6 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B5 hard matches 0 if score R1B5a hard matches 13 run structure load "hard/room1/2_interesting_paths:HMR1V2M3f" ^-1 ^7 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B5 hard matches 0 if score R1B5a hard matches 16 run structure load "hard/room1/2_interesting_paths:HMR1V2M3g" ^-1 ^8 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B5 hard matches 0 if score R1B5a hard matches 19 run structure load "hard/room1/2_interesting_paths:HMR1V2M3h" ^-1 ^9 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B5 hard matches 0 if score R1B5a hard matches 21 run structure load "hard/room1/2_interesting_paths:HMR1V2M3i" ^-1 ^10 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B5 hard matches 0 if score R1B5a hard matches 10 run playsound sfx.elevator.lift @a[tag=hard]
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B5 hard matches 0 if score R1B5a hard matches 21 run playsound sfx.elevator.stop @a[tag=hard]
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B5 hard matches 0 if score R1B5a hard matches 21.. run scoreboard players set R1B5 hard 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B5 hard matches 1 if score R1B5a hard matches 21.. run scoreboard players reset R1B5a hard
# // Exit Button
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B6 hard matches 0 if block ^-6 ^13 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R1B6a hard 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B6 hard matches 0 if score R1B6a hard matches 1 run fill ^-7 ^18 ^3 ^-7 ^18 ^4 air
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B6 hard matches 0 if score R1B6a hard matches 10 run fill ^-7 ^19 ^3 ^-7 ^19 ^4 air
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B6 hard matches 0 if score R1B6a hard matches 10 run tellraw @a[tag=hard] {"rawtext":[{"text": "§4Tunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B6 hard matches 0 if score R1B6a hard matches 10.. run scoreboard players set R1B6 hard 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score R1B6 hard matches 1 if score R1B6a hard matches 10.. run scoreboard players reset R1B6a hard
# // - Flooding -
execute if score started hard matches 1 if score p_game hard matches 1.. if score r1_end hard matches 0 run scoreboard players add r1_timer_ms hard 1
execute if score r1_timer_ms hard matches 20.. run scoreboard players remove r1_timer_s hard 1
execute if score r1_timer_ms hard matches 20.. run scoreboard players set r1_timer_ms hard 0
execute if score r1_timer_s hard matches ..0 run scoreboard players add flood1 hard 1
# // flood part
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score flood1 hard matches 1 if score r1_timer_s hard matches 0 run tellraw @a[tag=hard] {"rawtext":[{"text":"§3Water is rising§k!"}]}
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score flood1 hard matches 1 if score r1_timer_s hard matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F1" ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score flood1 hard matches 2 if score r1_timer_s hard matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F2" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score flood1 hard matches 3 if score r1_timer_s hard matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F3" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score flood1 hard matches 4 if score r1_timer_s hard matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F4" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score flood1 hard matches 5 if score r1_timer_s hard matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F5" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score flood1 hard matches 6 if score r1_timer_s hard matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F6" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score flood1 hard matches 7 if score r1_timer_s hard matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F7" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score flood1 hard matches 8 if score r1_timer_s hard matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F8" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score flood1 hard matches 9 if score r1_timer_s hard matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F9" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score flood1 hard matches 10 if score r1_timer_s hard matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F10" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score flood1 hard matches 11 if score r1_timer_s hard matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F11" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score flood1 hard matches 12 if score r1_timer_s hard matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F12" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score flood1 hard matches 13 if score r1_timer_s hard matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F13" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score flood1 hard matches 14 if score r1_timer_s hard matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F14" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score flood1 hard matches 15 if score r1_timer_s hard matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F15" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score flood1 hard matches 16 if score r1_timer_s hard matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F16" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room1] at @s if score flood1 hard matches 17 if score r1_timer_s hard matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F17" ~-6 ~18 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score r1_timer_s hard matches ..0 run scoreboard players set r1_timer_s hard 3
execute if score flood1 hard matches 17 if score r1_timer_ms hard matches 10 run scoreboard players set r1_end hard 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=hard_room1] at @s run tag @a[tag=hard, x=~-14, y=~18, z=~3, dx=4, dy=1, dz=1] add hardtunnel1
execute as @s[type=brr:flood_room, name=hard_room1] at @s run tag @a[tag=hard, x=~-7, y=~18, z=~3, dx=0, dy=1, dz=1] remove hardtunnel1
# // exit player count
scoreboard players set p_tunnel1 hard 0
execute as @a[tag=hardtunnel1] at @s run scoreboard players add p_tunnel1 hard 1
# // transition into room 2
execute if score p_tunnel1 hard = p_game hard if score started2 hard matches 0 run scoreboard players set r1_end hard 1
execute if score r1_end hard matches 1 unless score started2 hard matches 1 run scoreboard players add r1_transition hard 1
execute if score r1_transition hard matches 1 as @s[type=brr:flood_room, name=hard_room1] at @s run playsound sfx.doors.opened @a[tag=hard] ~-8 ~18 ~3 1 0.7
execute if score r1_transition hard matches 1 as @s[type=brr:flood_room, name=hard_room1] at @s run structure load "hard:HardTunnelDoor2" ~-8 ~18 ~3 90_degrees
execute if score r1_transition hard matches 10 as @s[type=brr:flood_room, name=hard_room1] at @s run structure load "hard:HardTunnelDoor1" ~-8 ~18 ~3 90_degrees
execute if score r1_transition hard matches 10 as @s[type=brr:flood_room, name=hard_room1] at @s positioned ~ ~2 ~ run fill ~-6 ~ ~-6 ~6 ~19 ~6 water
execute if score r1_transition hard matches 10 run scoreboard players set started2 hard 1
execute if score r1_transition hard matches 10.. run scoreboard players reset R1B1 hard
execute if score r1_transition hard matches 10.. run scoreboard players reset R1B2 hard
execute if score r1_transition hard matches 10.. run scoreboard players reset R1B3 hard
execute if score r1_transition hard matches 10.. run scoreboard players reset R1B4 hard
execute if score r1_transition hard matches 10.. run scoreboard players reset R1B5 hard
execute if score r1_transition hard matches 10.. run scoreboard players reset R1B6 hard
execute if score r1_transition hard matches 10.. run scoreboard players reset r1_extended hard
execute if score r1_transition hard matches 10.. run scoreboard players reset r1_timer_ms hard
execute if score r1_transition hard matches 10.. run scoreboard players reset r1_timer_s hard
execute if score r1_transition hard matches 10.. run scoreboard players reset r1_end hard
execute if score r1_transition hard matches 10.. run scoreboard players reset r1_transition hard