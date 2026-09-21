# = SYSTEM RUN =
# - special extra time due to unfair room design -
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 11 if score endless_timer_ms endless matches 1 if score endless_extended endless matches 0 run scoreboard players set endless_timer_s endless 14
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 14 if score endless_timer_ms endless matches 1 if score endless_extended endless matches 0 run scoreboard players set endless_extended endless 1
# - Level title -
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 14 if score endless_timer_ms endless matches 11 if score started endless matches 1 run title @a[tag=endless] subtitle §4Interesting Paths
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 14 if score endless_timer_ms endless matches 11 if score started endless matches 1 run titleraw @a[tag=endless] title {"rawtext":[{"text": "§4§lROOM "}, {"score":{"name": "room_count", "objective": "endless"}}]}
execute as @a[tag=endless] at @s run tag @s add endless_music
# - Test for buttons -
# // Button 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if block ^6 ^3 ^-5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players add R1B1a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if score R1B1a endless matches 1 run playsound sfx.doors.tunnelopen @a[tag=endless] ^2 ^3 ^-5.5
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if score R1B1a endless matches 1 run structure load "hard/room1/2_interesting_paths:HMR1V2M1" ^2 ^2 ^-6
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if score R1B1a endless matches 5 run structure load "hard/room1/2_interesting_paths:HMR1V2M1a" ^2 ^2 ^-6
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if score R1B1a endless matches 10 run structure load "hard/room1/2_interesting_paths:HMR1V2M1" ^-2 ^2 ^-6
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if score R1B1a endless matches 15 run structure load "hard/room1/2_interesting_paths:HMR1V2M1a" ^-2 ^2 ^-6
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if score R1B1a endless matches 15 run playsound sfx.doors.tunnelopen @a[tag=endless] ^-2 ^3 ^-5.5
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 0 if score R1B1a endless matches 15.. run scoreboard players set R1B1 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B1 endless matches 1 if score R1B1a endless matches 15.. run scoreboard players reset R1B1a endless
# // Button 2
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if block ^-5 ^3 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players add R1B2a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 1 run playsound sfx.doors.tunnelopen @a[tag=endless] ^-5.5 ^3 ^-2
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 1 run structure load "hard/room1/2_interesting_paths:HMR1V2M1" ^-6 ^2 ^-2 90_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 5 run structure load "hard/room1/2_interesting_paths:HMR1V2M1a" ^-6 ^2 ^-2 90_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 10 run structure load "hard/room1/2_interesting_paths:HMR1V2M1" ^-6 ^2 ^2 90_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 15 run structure load "hard/room1/2_interesting_paths:HMR1V2M1a" ^-6 ^2 ^2 90_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 15 run playsound sfx.doors.tunnelopen @a[tag=endless] ^-5.5 ^3 ^2
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 0 if score R1B2a endless matches 15.. run scoreboard players set R1B2 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B2 endless matches 1 if score R1B2a endless matches 15.. run scoreboard players reset R1B2a endless
# // Button 3
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B3 endless matches 0 if block ^-6 ^3 ^5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players add R1B3a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B3 endless matches 0 if score R1B3a endless matches 1 run playsound sfx.doors.tunnelopen @a[tag=endless] ^-2 ^3 ^5.5
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B3 endless matches 0 if score R1B3a endless matches 1 run structure load "hard/room1/2_interesting_paths:HMR1V2M1" ^-2 ^2 ^5
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B3 endless matches 0 if score R1B3a endless matches 5 run structure load "hard/room1/2_interesting_paths:HMR1V2M1a" ^-2 ^2 ^5
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B3 endless matches 0 if score R1B3a endless matches 10 run structure load "hard/room1/2_interesting_paths:HMR1V2M1" ^2 ^2 ^5
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B3 endless matches 0 if score R1B3a endless matches 15 run structure load "hard/room1/2_interesting_paths:HMR1V2M1a" ^2 ^2 ^5
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B3 endless matches 0 if score R1B3a endless matches 15 run playsound sfx.doors.tunnelopen @a[tag=endless] ^2 ^3 ^5.5
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B3 endless matches 0 if score R1B3a endless matches 15.. run scoreboard players set R1B3 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B3 endless matches 1 if score R1B3a endless matches 15.. run scoreboard players reset R1B3a endless
# // Button 4
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if block ^5 ^3 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players add R1B4a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 1 run playsound sfx.doors.tunnelopen @a[tag=endless] ^5.5 ^3 ^2
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 1 run structure load "hard/room1/2_interesting_paths:HMR1V2M1" ^5 ^2 ^2 90_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 5 run structure load "hard/room1/2_interesting_paths:HMR1V2M1a" ^5 ^2 ^2 90_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 10 run structure load "hard/room1/2_interesting_paths:HMR1V2M3" ^-1 ^1 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 13 run structure load "hard/room1/2_interesting_paths:HMR1V2M3a" ^-1 ^2 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 16 run structure load "hard/room1/2_interesting_paths:HMR1V2M3b" ^-1 ^3 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 19 run structure load "hard/room1/2_interesting_paths:HMR1V2M3c" ^-1 ^4 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 21 run structure load "hard/room1/2_interesting_paths:HMR1V2M3d" ^-1 ^5 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 10 run playsound sfx.elevator.lift @a[tag=endless]
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 21 run playsound sfx.elevator.stop @a[tag=endless]
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 0 if score R1B4a endless matches 21.. run scoreboard players set R1B4 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B4 endless matches 1 if score R1B4a endless matches 21.. run scoreboard players reset R1B4a endless
# // Button 5
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B5 endless matches 0 if block ^6 ^8 ^-5 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players add R1B5a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B5 endless matches 0 if score R1B5a endless matches 1 run playsound sfx.doors.tunnelopen @a[tag=endless] ^5.5 ^7 ^-3
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B5 endless matches 0 if score R1B5a endless matches 1 run structure load "hard/room1/2_interesting_paths:HMR1V2M2" ^5 ^7 ^-3
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B5 endless matches 0 if score R1B5a endless matches 5 run structure load "hard/room1/2_interesting_paths:HMR1V2M2a" ^5 ^7 ^-3
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B5 endless matches 0 if score R1B5a endless matches 10 run structure load "hard/room1/2_interesting_paths:HMR1V2M3e" ^-1 ^6 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B5 endless matches 0 if score R1B5a endless matches 13 run structure load "hard/room1/2_interesting_paths:HMR1V2M3f" ^-1 ^7 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B5 endless matches 0 if score R1B5a endless matches 16 run structure load "hard/room1/2_interesting_paths:HMR1V2M3g" ^-1 ^8 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B5 endless matches 0 if score R1B5a endless matches 19 run structure load "hard/room1/2_interesting_paths:HMR1V2M3h" ^-1 ^9 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B5 endless matches 0 if score R1B5a endless matches 21 run structure load "hard/room1/2_interesting_paths:HMR1V2M3i" ^-1 ^10 ^-1 180_degrees
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B5 endless matches 0 if score R1B5a endless matches 10 run playsound sfx.elevator.lift @a[tag=endless]
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B5 endless matches 0 if score R1B5a endless matches 21 run playsound sfx.elevator.stop @a[tag=endless]
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B5 endless matches 0 if score R1B5a endless matches 21.. run scoreboard players set R1B5 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B5 endless matches 1 if score R1B5a endless matches 21.. run scoreboard players reset R1B5a endless
# // Exit Button
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B6 endless matches 0 if block ^-6 ^13 ^6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R1B6a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B6 endless matches 0 if score R1B6a endless matches 1 run fill ^-7 ^18 ^3 ^-7 ^18 ^4 air
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B6 endless matches 0 if score R1B6a endless matches 10 run fill ^-7 ^19 ^3 ^-7 ^19 ^4 air
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B6 endless matches 0 if score R1B6a endless matches 10 run tellraw @a[tag=endless] {"rawtext":[{"text": "§4Tunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B6 endless matches 0 if score R1B6a endless matches 10.. run scoreboard players set R1B6 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R1B6 endless matches 1 if score R1B6a endless matches 10.. run scoreboard players reset R1B6a endless
# // - Flooding -
execute if score started endless matches 1 if score p_game endless matches 1.. if score endless_end endless matches 0 run scoreboard players add endless_timer_ms endless 1
execute if score endless_timer_ms endless matches 20.. run scoreboard players remove endless_timer_s endless 1
execute if score endless_timer_ms endless matches 20.. run scoreboard players set endless_timer_ms endless 0
execute if score endless_timer_s endless matches ..0 run scoreboard players add flood endless 1
# // flood part
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run tellraw @a[tag=endless] {"rawtext":[{"text":"§3Water is rising§k!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F1" ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F2" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 3 if score endless_timer_s endless matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F3" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 4 if score endless_timer_s endless matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F4" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 5 if score endless_timer_s endless matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F5" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 6 if score endless_timer_s endless matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F6" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 7 if score endless_timer_s endless matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F7" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 8 if score endless_timer_s endless matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F8" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 9 if score endless_timer_s endless matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F9" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 10 if score endless_timer_s endless matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F10" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 11 if score endless_timer_s endless matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F11" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 12 if score endless_timer_s endless matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F12" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 13 if score endless_timer_s endless matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F13" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 14 if score endless_timer_s endless matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F14" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 15 if score endless_timer_s endless matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F15" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 16 if score endless_timer_s endless matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F16" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 17 if score endless_timer_s endless matches 0 run structure load "hard/room1/2_interesting_paths:HMR1V2F17" ~-6 ~18 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score endless_timer_s endless matches ..0 run scoreboard players set endless_timer_s endless 3
execute if score flood endless matches 17 if score endless_timer_ms endless matches 10 run scoreboard players set endless_end endless 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=endless] at @s run tag @a[tag=endless, x=~-14, y=~18, z=~3, dx=4, dy=1, dz=1] add endlesstunnel
execute as @s[type=brr:flood_room, name=endless] at @s run tag @a[tag=endless, x=~-7, y=~18, z=~3, dx=0, dy=1, dz=1] remove endlesstunnel
# // exit player count
scoreboard players set p_tunnel1 endless 0
execute as @a[tag=endlesstunnel] at @s run scoreboard players add p_tunnel1 endless 1
# // transition into room 2
execute if score p_tunnel1 endless = p_game endless run scoreboard players set endless_end endless 1
execute if score endless_end endless matches 1 run scoreboard players add endless_transition endless 1
execute if score endless_transition endless matches 1 as @s[type=brr:flood_room, name=endless] at @s run playsound sfx.doors.opened @a[tag=endless] ~-8 ~18 ~3 1 0.7
execute if score endless_transition endless matches 1 as @s[type=brr:flood_room, name=endless] at @s run structure load "hard:HardTunnelDoor2" ~-8 ~18 ~3 90_degrees
execute if score endless_transition endless matches 10 as @s[type=brr:flood_room, name=endless] at @s run structure load "hard:HardTunnelDoor1" ~-8 ~18 ~3 90_degrees
execute if score endless_transition endless matches 10 as @s[type=brr:flood_room, name=endless] at @s positioned ~ ~2 ~ run fill ~-6 ~ ~-6 ~6 ~19 ~6 water
execute if score endless_transition endless matches 31.. run function game_functions/mode_endless/reset_room