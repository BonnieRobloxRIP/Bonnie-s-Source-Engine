# = SYSTEM RUN =
# - special extra time due to unfair room design -
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 11 if score r2_timer_ms hard matches 1 if score r2_extended hard matches 0 run scoreboard players set r2_timer_s hard 16
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 16 if score r2_timer_ms hard matches 1 if score r2_extended hard matches 0 run scoreboard players set r2_extended hard 1
# = Special intro -
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 13 if score r2_timer_ms hard matches 1 run structure load "hard:HardTunnelDoor2" ~-8 ~2 ~3 90_degrees
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 13 if score r2_timer_ms hard matches 1 run playsound sfx.doors.tunnelopen @a[tag=hard] ~-8 ~3 ~3.5
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 13 if score r2_timer_ms hard matches 5 run playsound sfx.powerdown @a[tag=hard]
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 13 if score r2_timer_ms hard matches 5 run scoreboard players random metal lobby 1 7
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 13 if score r2_timer_ms hard matches 5 run structure load "hard/room2/1_ventilation_failure:HMR2V1M1a" ^-6 ^2 ^2
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 13 if score r2_timer_ms hard matches 7 run structure load "hard/room2/1_ventilation_failure:HMR2V1M1" ^-6 ^2 ^2
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 13 if score r2_timer_ms hard matches 9 run structure load "hard/room2/1_ventilation_failure:HMR2V1M1a" ^-6 ^2 ^2
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 13 if score r2_timer_ms hard matches 18 run structure load "hard/room2/1_ventilation_failure:HMR2V1M1b" ^-6 ^2 ^2
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 13 if score r2_timer_ms hard matches 18 run playsound tile.piston.in @a[tag=hard] ~-3 ~3 ~4
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 12 if score r2_timer_ms hard matches 1 run playsound tile.piston.out @a[tag=hard] ~-3 ~3 ~4
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 12 if score r2_timer_ms hard matches 1 run structure load "hard/room2/1_ventilation_failure:HMR2V1M1c" ^-6 ^2 ^2
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 12 if score r2_timer_ms hard matches 1 run tellraw @a[tag=hard] {"rawtext":[{"text": "§4§lAdditional Objective: §r§4Ventilation Failure, Detected. Room destination re-routed. Proceed thought the emergency hatch."}]}
# - Open entrance door -
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 16 if score r2_timer_ms hard matches 1 run structure load "hard:HardTunnelDoor2" ~8 ~2 ~3 90_degrees
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 16 if score r2_timer_ms hard matches 10 run structure load "hard:HardTunnelDoor3" ~8 ~2 ~3 90_degrees
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score started2 hard matches 1 if score r2_timer_s hard matches 16 if score r2_timer_ms hard matches 10 run playsound sfx.doors.tunnelopen @a[tag=hard] ~8 ~3 ~3.5
# - Level title -
execute as @a[tag=hard] at @s if score r2_timer_s hard matches 11 if score r2_timer_ms hard matches 10 if score started2 hard matches 1 run title @a[tag=hard] subtitle §4Ventilation Failure
execute as @a[tag=hard] at @s if score r2_timer_s hard matches 11 if score r2_timer_ms hard matches 10 if score started2 hard matches 1 run title @a[tag=hard] title §4§lROOM 2
# - Test for buttons -
# // Button 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B1 hard matches 0 if block ^-3 ^3 ^4 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="north"] run scoreboard players add R2B1a hard 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B1 hard matches 0 if score R2B1a hard matches 1 run playsound tile.piston.in @a[tag=hard] ~3 ~3 ~4
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B1 hard matches 0 if score R2B1a hard matches 1 run structure load "hard/room2/1_ventilation_failure:HMR2V1M1d" ^-6 ^2 ^2
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B1 hard matches 0 if score R2B1a hard matches 5 run structure load "hard/room2/1_ventilation_failure:HMR2V1M1e" ^-6 ^2 ^2 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B1 hard matches 0 if score R2B1a hard matches 5 run playsound tile.piston.out @a[tag=hard] ~3 ~3 ~4
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B1 hard matches 0 if score R2B1a hard matches 5.. run scoreboard players set R2B1 hard 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B1 hard matches 1 if score R2B1a hard matches 5.. run scoreboard players reset R2B1a hard
# // Button 2
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if block ^-6 ^2 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="up"] run scoreboard players add R2B2a hard 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 1 run playsound sfx.moving_part.start @a[tag=hard]
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 1 run structure load "hard/room2/1_ventilation_failure:HMR2V1M2" ^-4 ^2 ^-1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 3 run structure load "hard/room2/1_ventilation_failure:HMR2V1M2a" ^-4 ^2 ^-1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 5 run structure load "hard/room2/1_ventilation_failure:HMR2V1M2b" ^-4 ^2 ^-1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 7 run structure load "hard/room2/1_ventilation_failure:HMR2V1M2c" ^-4 ^2 ^-1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 9 run structure load "hard/room2/1_ventilation_failure:HMR2V1M2d" ^-4 ^2 ^-1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 11 run structure load "hard/room2/1_ventilation_failure:HMR2V1M2e" ^-4 ^2 ^-1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 13 run structure load "hard/room2/1_ventilation_failure:HMR2V1M2f" ^-4 ^2 ^-1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 13 run playsound sfx.moving_part.stop @a[tag=hard]
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 13 run stopsound @a[tag=hard] sfx.moving_part.start
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 0 if score R2B2a hard matches 13.. run scoreboard players set R2B2 hard 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B2 hard matches 1 if score R2B2a hard matches 13.. run scoreboard players reset R2B2a hard
# // Exit Button
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score R2B3 hard matches 0 if block ^6 ^16 ^5 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players add R2B3a hard 1
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
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 1 if score r2_timer_s hard matches 0 run structure load "hard/room2/1_ventilation_failure:HMR2V1F1" ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 2 if score r2_timer_s hard matches 0 run structure load "hard/room2/1_ventilation_failure:HMR2V1F2" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 3 if score r2_timer_s hard matches 0 run structure load "hard/room2/1_ventilation_failure:HMR2V1F3" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 4 if score r2_timer_s hard matches 0 run structure load "hard/room2/1_ventilation_failure:HMR2V1F4" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 5 if score r2_timer_s hard matches 0 run structure load "hard/room2/1_ventilation_failure:HMR2V1F5" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 6 if score r2_timer_s hard matches 0 run structure load "hard/room2/1_ventilation_failure:HMR2V1F6" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 7 if score r2_timer_s hard matches 0 run structure load "hard/room2/1_ventilation_failure:HMR2V1F7" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 8 if score r2_timer_s hard matches 0 run structure load "hard/room2/1_ventilation_failure:HMR2V1F8" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 9 if score r2_timer_s hard matches 0 run structure load "hard/room2/1_ventilation_failure:HMR2V1F9" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 10 if score r2_timer_s hard matches 0 run structure load "hard/room2/1_ventilation_failure:HMR2V1F10" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 11 if score r2_timer_s hard matches 0 run structure load "hard/room2/1_ventilation_failure:HMR2V1F11" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 12 if score r2_timer_s hard matches 0 run structure load "hard/room2/1_ventilation_failure:HMR2V1F12" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 13 if score r2_timer_s hard matches 0 run structure load "hard/room2/1_ventilation_failure:HMR2V1F13" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 14 if score r2_timer_s hard matches 0 run structure load "hard/room2/1_ventilation_failure:HMR2V1F14" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 15 if score r2_timer_s hard matches 0 run structure load "hard/room2/1_ventilation_failure:HMR2V1F15" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 16 if score r2_timer_s hard matches 0 run structure load "hard/room2/1_ventilation_failure:HMR2V1F16" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 17 if score r2_timer_s hard matches 0 run structure load "hard/room2/1_ventilation_failure:HMR2V1F17" ~-6 ~18 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=hard_room2] at @s if score flood2 hard matches 18 if score r2_timer_s hard matches 0 run structure load "hard/room2/1_ventilation_failure:HMR2V1F18" ~-6 ~19 ~-6 0_degrees none block_by_block 1
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