# = SYSTEM RUN =
# - Open entrance door -
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 16 if score endless_timer_ms endless matches 1 run structure load "medium:MediumTunnelDoor2" ~3 ~2 ~8
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 16 if score endless_timer_ms endless matches 10 run structure load "medium:MediumTunnelDoor3" ~3 ~2 ~8
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 16 if score endless_timer_ms endless matches 10 run playsound sfx.doors.tunnelopen @a[tag=endless] ~3.5 ~3 ~8
# - Level title -
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 16 if score endless_timer_ms endless matches 10 if score started endless matches 1 run title @a[tag=endless] subtitle §6Electric Tower
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 16 if score endless_timer_ms endless matches 10 if score started endless matches 1 run titleraw @a[tag=endless] title {"rawtext":[{"text": "§eROOM "}, {"score":{"name": "room_count", "objective": "endless"}}]}
execute as @a[tag=endless] at @s run tag @s add endless_music
# - Test for buttons -
# // Button 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if block ^-6 ^9 ^6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run structure load "medium/room3/3_electric_tower:MMR3V3M1" ~-1 ~7 ~-1 0_degrees none block_by_block 2
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B1 endless matches 0 if block ^-6 ^9 ^6  brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="east"] run scoreboard players set R3B1 endless 1
# // Button 2
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if block ^-6 ^15 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run structure load "medium/room3/3_electric_tower:MMR3V3M2" ~-1 ~11 ~-1 0_degrees none block_by_block 3
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B2 endless matches 0 if block ^-6 ^15 ^-6 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="south"] run scoreboard players set R3B2 endless 1
# // Exit Button
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if block ^6 ^20 ^-6 brr:flood_button["brr:button_type"="exit","brr:pressed"=true, "minecraft:block_face"="down"] run scoreboard players add R3B3a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 1 run fill ^-7 ^19 ^-4 ^-7 ^19 ^-5 air
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 10 run fill ^-7 ^20 ^-4 ^-7 ^20 ^-5 air
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 10 run tellraw @a[tag=endless] {"rawtext":[{"text": "§eTunnel Gate has been Opened!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 0 if score R3B3a endless matches 10.. run scoreboard players set R3B3 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R3B3 endless matches 1 if score R3B3a endless matches 10.. run scoreboard players reset R3B3a endless
# // - Flooding -
execute if score started endless matches 1 if score p_game endless matches 1.. if score endless_end endless matches 0 run scoreboard players add endless_timer_ms endless 1
execute if score endless_timer_ms endless matches 20.. run scoreboard players remove endless_timer_s endless 1
execute if score endless_timer_ms endless matches 20.. run scoreboard players set endless_timer_ms endless 0
execute if score endless_timer_s endless matches ..0 run scoreboard players add flood endless 1
# // flood part
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 3 if score endless_timer_ms endless matches 0 run playsound sfx.doors.opened @a[tag=endless] ~3.5 ~3 ~8 1 0.7
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 3 if score endless_timer_ms endless matches 0 run structure load "medium:MediumTunnelDoor2" ~3 ~2 ~8
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 3 if score endless_timer_ms endless matches 5 run structure load "medium:MediumTunnelDoor1" ~3 ~2 ~8
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 3 if score endless_timer_ms endless matches 5 run structure load "easy:NuhUh" ~3 ~2 ~9
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run tellraw @a[tag=endless] {"rawtext":[{"text":"§3Water is rising!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run structure load "medium/room3/3_electric_tower:MMR3V3F1" ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 0 run structure load "medium/room3/3_electric_tower:MMR3V3F2" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 3 if score endless_timer_s endless matches 0 run structure load "medium/room3/3_electric_tower:MMR3V3F3" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 4 if score endless_timer_s endless matches 0 run structure load "medium/room3/3_electric_tower:MMR3V3F4" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 5 if score endless_timer_s endless matches 0 run structure load "medium/room3/3_electric_tower:MMR3V3F5" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 6 if score endless_timer_s endless matches 0 run structure load "medium/room3/3_electric_tower:MMR3V3F6" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 7 if score endless_timer_s endless matches 0 run structure load "medium/room3/3_electric_tower:MMR3V3F7" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 8 if score endless_timer_s endless matches 0 run structure load "medium/room3/3_electric_tower:MMR3V3F8" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 9 if score endless_timer_s endless matches 0 run structure load "medium/room3/3_electric_tower:MMR3V3F9" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 10 if score endless_timer_s endless matches 0 run structure load "medium/room3/3_electric_tower:MMR3V3F10" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 11 if score endless_timer_s endless matches 0 run structure load "medium/room3/3_electric_tower:MMR3V3F11" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 12 if score endless_timer_s endless matches 0 run structure load "medium/room3/3_electric_tower:MMR3V3F12" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 13 if score endless_timer_s endless matches 0 run structure load "medium/room3/3_electric_tower:MMR3V3F13" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 14 if score endless_timer_s endless matches 0 run structure load "medium/room3/3_electric_tower:MMR3V3F14" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 15 if score endless_timer_s endless matches 0 run structure load "medium/room3/3_electric_tower:MMR3V3F15" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 16 if score endless_timer_s endless matches 0 run structure load "medium/room3/3_electric_tower:MMR3V3F16" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 17 if score endless_timer_s endless matches 0 run structure load "medium/room3/3_electric_tower:MMR3V3F17" ~-6 ~18 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 18 if score endless_timer_s endless matches 0 run structure load "medium/room3/3_electric_tower:MMR3V3F18" ~-6 ~19 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score endless_timer_s endless matches ..0 run scoreboard players set endless_timer_s endless 4
execute if score flood endless matches 18 if score endless_timer_ms endless matches 10 run scoreboard players set endless_end endless 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=endless] at @s run tag @a[tag=endless, x=~-15, y=~19, z=~-5, dx=5, dy=1, dz=1] add endlesstunnel
execute as @s[type=brr:flood_room, name=endless] at @s run tag @a[tag=endless, x=~-7, y=~19, z=~-5, dx=0, dy=1, dz=1] remove endlesstunnel
# // exit player count
scoreboard players set p_tunnel endless 0
execute as @a[tag=endlesstunnel] at @s run scoreboard players add p_tunnel endless 1
# // transition into room 3
execute if score p_tunnel endless = p_game endless run scoreboard players set endless_end endless 1
execute if score endless_end endless matches 1 run scoreboard players add endless_transition endless 1
execute if score endless_transition endless matches 1 as @s[type=brr:flood_room, name=endless] at @s run playsound sfx.doors.opened @a[tag=endless] ~-8 ~19.5 ~-4.5 1 0.7
execute if score endless_transition endless matches 1 as @s[type=brr:flood_room, name=endless] at @s run structure load "medium:MediumTunnelDoor2" ~-8 ~19 ~-5 270_degrees
execute if score endless_transition endless matches 10 as @s[type=brr:flood_room, name=endless] at @s run structure load "medium:MediumTunnelDoor1" ~-8 ~19 ~-5 270_degrees
execute if score endless_transition endless matches 10 as @s[type=brr:flood_room, name=endless] at @s positioned ~ ~2 ~ run fill ~-6 ~ ~-6 ~6 ~19 ~6 water
execute if score endless_transition endless matches 31.. run function game_functions/mode_endless/reset_room