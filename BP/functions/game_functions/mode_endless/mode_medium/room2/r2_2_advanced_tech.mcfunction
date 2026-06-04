# = SYSTEM RUN =
# - Open entrance door -
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 16 if score endless_timer_ms endless matches 1 run structure load "medium/MediumTunnelDoor2" ~1 ~2 ~8
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 16 if score endless_timer_ms endless matches 10 run structure load "medium/MediumTunnelDoor3" ~1 ~2 ~8
execute as @s[type=brr:flood_room, name=endless] at @s if score started endless matches 1 if score endless_timer_s endless matches 16 if score endless_timer_ms endless matches 10 run playsound sfx.doors.tunnelopen @a[tag=endless] ~1.5 ~3 ~8
# - Level title -
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 16 if score endless_timer_ms endless matches 10 if score started endless matches 1 run title @a[tag=endless] subtitle §6Advanced Tech
execute as @a[tag=endless] at @s if score endless_timer_s endless matches 16 if score endless_timer_ms endless matches 10 if score started endless matches 1 run titleraw @a[tag=endless] title {"rawtext":[{"text": "§eROOM "}, {"score":{"name": "room_count", "objective": "endless"}}]}
execute as @a[tag=endless] at @s run tag @s add endless_music
# - Test for buttons -
execute unless score R2Code endless matches 1.. run scoreboard players set code_match endless 0
# // Button 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B1 endless matches 0 if block ^6 ^3 ^-2 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players add R2B1a endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B1 endless matches 0 if score R2B1a endless matches 1 if block ^6 ^3 ^-2 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "medium/room2/2_advanced_tech:MMR2V2M1" ~-6 ~2 ~-3
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B1 endless matches 0 if score R2B1a endless matches 10 if block ^6 ^3 ^-2 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "medium/room2/2_advanced_tech:MMR2V2M1a" ~-6 ~2 ~-3
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B1 endless matches 0 if score R2B1a endless matches 20 if block ^6 ^3 ^-2 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run structure load "medium/room2/2_advanced_tech:MMR2V2M1b" ~-6 ~2 ~-3
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B1 endless matches 0 if score R2B1a endless matches 20.. if block ^6 ^3 ^-2 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players set R2B1 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2B1 endless matches 1 if score R2B1a endless matches 20.. if block ^6 ^3 ^-2 brr:flood_button["brr:button_type"="parkour","brr:pressed"=true, "minecraft:block_face"="west"] run scoreboard players reset R2B1a endless
# // Code 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2C1 endless matches 0 unless score R2Code endless matches 1.. if block ^-4 ^12 ^4 brr:flood_exit_button["brr:pressed"=false,"minecraft:cardinal_direction"="east"] run scoreboard players add code_match endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2C1 endless matches 1 unless score R2Code endless matches 1.. if block ^-4 ^12 ^4 brr:flood_exit_button["brr:pressed"=true,"minecraft:cardinal_direction"="east"] run scoreboard players add code_match endless 1
# // Code 2
execute as @s[type=brr:flood_room, name=endless] at @s if score R2C2 endless matches 0 unless score R2Code endless matches 1.. if block ^-4 ^12 ^3 brr:flood_exit_button["brr:pressed"=false,"minecraft:cardinal_direction"="east"] run scoreboard players add code_match endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2C2 endless matches 1 unless score R2Code endless matches 1.. if block ^-4 ^12 ^3 brr:flood_exit_button["brr:pressed"=true,"minecraft:cardinal_direction"="east"] run scoreboard players add code_match endless 1
# // Code 3
execute as @s[type=brr:flood_room, name=endless] at @s if score R2C3 endless matches 0 unless score R2Code endless matches 1.. if block ^-4 ^12 ^2 brr:flood_exit_button["brr:pressed"=false,"minecraft:cardinal_direction"="east"] run scoreboard players add code_match endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2C3 endless matches 1 unless score R2Code endless matches 1.. if block ^-4 ^12 ^2 brr:flood_exit_button["brr:pressed"=true,"minecraft:cardinal_direction"="east"] run scoreboard players add code_match endless 1
# // Code 4
execute as @s[type=brr:flood_room, name=endless] at @s if score R2C4 endless matches 0 unless score R2Code endless matches 1.. if block ^-5 ^12 ^1 brr:flood_exit_button["brr:pressed"=false,"minecraft:cardinal_direction"="north"] run scoreboard players add code_match endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2C4 endless matches 1 unless score R2Code endless matches 1.. if block ^-5 ^12 ^1 brr:flood_exit_button["brr:pressed"=true,"minecraft:cardinal_direction"="north"] run scoreboard players add code_match endless 1
# // Code 5
execute as @s[type=brr:flood_room, name=endless] at @s if score R2C5 endless matches 0 unless score R2Code endless matches 1.. if block ^-6 ^12 ^1 brr:flood_exit_button["brr:pressed"=false,"minecraft:cardinal_direction"="north"] run scoreboard players add code_match endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2C5 endless matches 1 unless score R2Code endless matches 1.. if block ^-6 ^12 ^1 brr:flood_exit_button["brr:pressed"=true,"minecraft:cardinal_direction"="north"] run scoreboard players add code_match endless 1
# // On Code Match
execute as @s[type=brr:flood_room, name=endless] at @s if score code_match endless matches 5 unless score R2Code endless matches 1.. run scoreboard players set R2Code endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code endless matches 1 run scoreboard players add R2Code1 endless 1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code1 endless matches 1 run playsound sfx.alarm.lift @a[tag=endless] ~ ~15 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code1 endless matches 1 run playsound sfx.elevator.lift @a[tag=endless] ~ ~15 ~
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code1 endless matches 5 run structure load "medium/room2/2_advanced_tech:MMR2V2M2" ~-1 ~1 ~-1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code1 endless matches 10 run structure load "medium/room2/2_advanced_tech:MMR2V2M2" ~-1 ~2 ~-1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code1 endless matches 15 run structure load "medium/room2/2_advanced_tech:MMR2V2M2" ~-1 ~3 ~-1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code1 endless matches 20 run structure load "medium/room2/2_advanced_tech:MMR2V2M2" ~-1 ~4 ~-1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code1 endless matches 25 run structure load "medium/room2/2_advanced_tech:MMR2V2M2a" ~-1 ~5 ~-1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code1 endless matches 30 run structure load "medium/room2/2_advanced_tech:MMR2V2M2b" ~-1 ~6 ~-1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code1 endless matches 35 run structure load "medium/room2/2_advanced_tech:MMR2V2M2c" ~-1 ~7 ~-1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code1 endless matches 40 run structure load "medium/room2/2_advanced_tech:MMR2V2M2d" ~-1 ~8 ~-1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code1 endless matches 45 run structure load "medium/room2/2_advanced_tech:MMR2V2M2e" ~-1 ~9 ~-1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code1 endless matches 50 run structure load "medium/room2/2_advanced_tech:MMR2V2M2f" ~-1 ~10 ~-1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code1 endless matches 55 run structure load "medium/room2/2_advanced_tech:MMR2V2M2g" ~-1 ~11 ~-1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code1 endless matches 60 run structure load "medium/room2/2_advanced_tech:MMR2V2M2h" ~-1 ~12 ~-1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code1 endless matches 65 run structure load "medium/room2/2_advanced_tech:MMR2V2M2i" ~-1 ~13 ~-1
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code1 endless matches 65.. run scoreboard players set R2Code endless 2
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code1 endless matches 65.. run scoreboard players reset code_match endless
execute as @s[type=brr:flood_room, name=endless] at @s if score R2Code1 endless matches 65.. run scoreboard players reset R2Code1 endless
# // - Flooding -
execute if score started endless matches 1 if score p_game endless matches 1.. if score endless_end endless matches 0 run scoreboard players add endless_timer_ms endless 1
execute if score endless_timer_ms endless matches 20.. run scoreboard players remove endless_timer_s endless 1
execute if score endless_timer_ms endless matches 20.. run scoreboard players set endless_timer_ms endless 0
execute if score endless_timer_s endless matches ..0 run scoreboard players add flood endless 1
# // flood part
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 3 if score endless_timer_ms endless matches 0 run playsound sfx.doors.opened @a[tag=endless] ~1.5 ~3 ~8 1 0.7
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 3 if score endless_timer_ms endless matches 0 run structure load "medium/MediumTunnelDoor2" ~1 ~2 ~8
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 3 if score endless_timer_ms endless matches 5 run structure load "medium/MediumTunnelDoor1" ~1 ~2 ~8
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 3 if score endless_timer_ms endless matches 5 run structure load "endless:NuhUh" ~1 ~2 ~9
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run tellraw @a[tag=endless] {"rawtext":[{"text":"§3Water is rising!"}]}
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 1 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2F1" ~-6 ~2 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2F2" ~-6 ~3 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2M3b" ^4 ^2 ^1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 0 if score endless_timer_ms endless matches 0 run fill ^-2 ^2 ^-6 ^6 ^20 ^6 light_block_15 replace air
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 4 if score endless_timer_ms endless matches 2 run fill ^-6 ^2 ^-6 ^6 ^20 ^6 air replace light_block_15
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 0 if score endless_timer_ms endless matches 0 run playsound sfx.ambiance.generator.explode @a[tag=endless]
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 0 if score endless_timer_ms endless matches 0 run scoreboard players random explosion lobby 1 6
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 0 if score endless_timer_ms endless matches 0 run stopsound  @a[tag=endless] sfx.ambiance.generator.1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 4 if score endless_timer_ms endless matches 0..3 run particle brr:generator_explode ^5 ^3 ^3
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 0 if score endless_timer_ms endless matches 0 run camerashake add @a[tag=endless] 0.4 0.6 positional
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 3 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2F3" ~-6 ~4 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 3 if score endless_timer_ms endless matches 0 run playsound sfx.powerdown @a[tag=endless]
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 3 if score endless_timer_ms endless matches 0 run structure load "medium/room2:MediumRoom2Offline" ~-7 ~1 ~-14 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 3 if score endless_timer_ms endless matches 0 run fill ^-6 ^2 ^-6 ^6 ^20 ^6 soul_lantern["hanging"=true] replace lantern["hanging"=true]
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 2 if score endless_timer_s endless matches 3 if score endless_timer_ms endless matches 0 run fill ^-6 ^2 ^-6 ^6 ^20 ^6 soul_lantern["hanging"=false] replace lantern["hanging"=false]
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 4 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2F4" ~-6 ~5 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 5 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2F5" ~-6 ~6 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 6 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2F6" ~-6 ~7 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 7 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2F7" ~-6 ~8 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 8 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2F8" ~-6 ~9 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 9 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2F9" ~-6 ~10 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 10 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2F10" ~-6 ~11 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 11 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2F11" ~-6 ~12 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 12 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2F12" ~-6 ~13 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 13 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2F13" ~-6 ~14 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 14 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2F14" ~-6 ~15 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 15 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2F15" ~-6 ~16 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 16 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2F16" ~-6 ~17 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 17 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2F17" ~-6 ~18 ~-6 0_degrees none block_by_block 1
execute as @s[type=brr:flood_room, name=endless] at @s if score flood endless matches 18 if score endless_timer_s endless matches 0 run structure load "medium/room2/2_advanced_tech:MMR2V2F18" ~-6 ~19 ~-6 0_degrees none block_by_block 1
# // flood end
execute if score endless_timer_s endless matches ..0 run scoreboard players set endless_timer_s endless 4
execute if score flood endless matches 18 if score endless_timer_ms endless matches 10 run scoreboard players set endless_end endless 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=endless] at @s run tag @a[tag=endless, x=~-4, y=~19, z=~-14, dx=1, dy=1, dz=4] add endlesstunnel
execute as @s[type=brr:flood_room, name=endless] at @s run tag @a[tag=endless, x=~-4, y=~19, z=~-7, dx=1, dy=1, dz=0] remove endlesstunnel
# // exit player count
scoreboard players set p_tunnel endless 0
execute as @a[tag=endlesstunnel] at @s run scoreboard players add p_tunnel endless 1
# // transition into room 3
execute if score p_tunnel endless = p_game endless run scoreboard players set endless_end endless 1
execute if score endless_end endless matches 1 run scoreboard players add endless_transition endless 1
execute if score endless_transition endless matches 1 as @s[type=brr:flood_room, name=endless] at @s run playsound sfx.doors.opened @a[tag=endless] ~-3.5 ~19 ~-8 1 0.7
execute if score endless_transition endless matches 1 as @s[type=brr:flood_room, name=endless] at @s run structure load "medium/MediumTunnelDoor2" ~-4 ~19 ~-8
execute if score endless_transition endless matches 10 as @s[type=brr:flood_room, name=endless] at @s run structure load "medium/MediumTunnelDoor1" ~-4 ~19 ~-8
execute if score endless_transition endless matches 10 as @s[type=brr:flood_room, name=endless] at @s positioned ~ ~2 ~ run fill ~-6 ~ ~-6 ~6 ~19 ~6 water
execute if score endless_transition endless matches 31.. run function game_functions/mode_endless/reset_room


# // Actionbar info
execute as @s[type=brr:flood_room, name=endless] at @s if score code_match endless matches 1 run title @a[tag=endless] actionbar §61/5
execute as @s[type=brr:flood_room, name=endless] at @s if score code_match endless matches 2 run title @a[tag=endless] actionbar §62/5
execute as @s[type=brr:flood_room, name=endless] at @s if score code_match endless matches 3 run title @a[tag=endless] actionbar §63/5
execute as @s[type=brr:flood_room, name=endless] at @s if score code_match endless matches 4 run title @a[tag=endless] actionbar §64/5
execute as @s[type=brr:flood_room, name=endless] at @s if score code_match endless matches 5 run title @a[tag=endless] actionbar §e5/5!
# // Generator animation
# // scores
execute as @s[type=brr:flood_room, name=endless] at @s unless score flood endless matches 2.. run scoreboard players add R2Animation endless 1
execute as @s[type=brr:flood_room, name=endless] at @s unless score flood endless matches 2.. run scoreboard players add R2Ambiance endless 1
# // animation
execute as @s[type=brr:flood_room, name=endless] at @s unless score flood endless matches 2.. if score R2Animation endless matches 1 run structure load "medium/room2/2_advanced_tech:MMR2V2M3" ^4 ^2 ^1
execute as @s[type=brr:flood_room, name=endless] at @s unless score flood endless matches 2.. if score R2Animation endless matches 3 run structure load "medium/room2/2_advanced_tech:MMR2V2M3a" ^4 ^2 ^1
execute as @s[type=brr:flood_room, name=endless] at @s unless score flood endless matches 2.. if score R2Animation endless matches 4.. run scoreboard players set R2Animation endless 0
# // sound
execute as @s[type=brr:flood_room, name=endless] at @s unless score flood endless matches 2.. if score R2Ambiance endless matches 1 run playsound sfx.ambiance.generator.1 @a[tag=endless] ^5 ^3 ^3
execute as @s[type=brr:flood_room, name=endless] at @s unless score flood endless matches 2.. if score R2Ambiance endless matches 177.. run scoreboard players set R2Ambiance endless 0