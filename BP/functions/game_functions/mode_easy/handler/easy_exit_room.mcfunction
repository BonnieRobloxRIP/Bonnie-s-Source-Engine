# = SYSTEM RUN =
# - Level title -
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r4_timer_s easy matches 31 if score r4_timer_ms easy matches 2 if score started4 easy matches 1 run structure load "easy/exit_room:ExitGlassFloor" ~-1 ~13 ~
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r4_timer_s easy matches 31 if score r4_timer_ms easy matches 4 if score started4 easy matches 1 run structure load "easy/exit_room:ExitGlassFloor" ~-1 ~12 ~
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r4_timer_s easy matches 31 if score r4_timer_ms easy matches 6 if score started4 easy matches 1 run structure load "easy/exit_room:ExitGlassFloor" ~-1 ~11 ~
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r4_timer_s easy matches 31 if score r4_timer_ms easy matches 8 if score started4 easy matches 1 run structure load "easy/exit_room:ExitGlassFloor" ~-1 ~10 ~
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r4_timer_s easy matches 31 if score r4_timer_ms easy matches 10 if score started4 easy matches 1 run structure load "easy/exit_room:ExitGlassFloor" ~-1 ~9 ~
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r4_timer_s easy matches 31 if score r4_timer_ms easy matches 12 if score started4 easy matches 1 run structure load "easy/exit_room:ExitGlassFloor" ~-1 ~8 ~
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r4_timer_s easy matches 31 if score r4_timer_ms easy matches 14 if score started4 easy matches 1 run structure load "easy/exit_room:ExitGlassFloor" ~-1 ~7 ~
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r4_timer_s easy matches 31 if score r4_timer_ms easy matches 16 if score started4 easy matches 1 run structure load "easy/exit_room:ExitGlassFloor" ~-1 ~6 ~
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r4_timer_s easy matches 31 if score r4_timer_ms easy matches 18 if score started4 easy matches 1 run structure load "easy/exit_room:ExitGlassFloor" ~-1 ~5 ~
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r4_timer_s easy matches 30 if score r4_timer_ms easy matches 2 if score started4 easy matches 1 run structure load "easy/exit_room:ExitGlassFloor" ~-1 ~4 ~
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r4_timer_s easy matches 30 if score r4_timer_ms easy matches 4 if score started4 easy matches 1 run structure load "easy/exit_room:ExitGlassFloor" ~-1 ~3 ~
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r4_timer_s easy matches 30 if score r4_timer_ms easy matches 6 if score started4 easy matches 1 run structure load "easy/exit_room:ExitGlassFloor" ~-1 ~2 ~
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score r4_timer_s easy matches 30 if score r4_timer_ms easy matches 8 if score started4 easy matches 1 run fill ~-1 ~2 ~ ~ ~2 ~1 air destroy
execute as @a[tag=easy] at @s if score r4_timer_s easy matches 30 if score r4_timer_ms easy matches 15 if score started4 easy matches 1 run title @a[tag=easy] subtitle §2Guess the code, then run.
execute as @a[tag=easy] at @s if score r4_timer_s easy matches 30 if score r4_timer_ms easy matches 15 if score started4 easy matches 1 run title @a[tag=easy] title §aEXIT ROOM
# - Test for buttons -
execute unless score exit_door easy matches 1 run scoreboard players set code_match easy 0
execute unless score exit_door easy matches 1 run scoreboard players set left_code easy 0
execute unless score exit_door easy matches 1 run scoreboard players set right_code easy 0
# // Left Code 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score left_code1 easy matches 0 unless score exit_door easy matches 1 if block ^9 ^3 ^-5 brr:flood_exit_button["brr:pressed"=false,"minecraft:cardinal_direction"="east"] run scoreboard players add code_match easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score left_code1 easy matches 0 unless score exit_door easy matches 1 if block ^9 ^3 ^-5 brr:flood_exit_button["brr:pressed"=false,"minecraft:cardinal_direction"="east"] run scoreboard players add left_code easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score left_code1 easy matches 1 unless score exit_door easy matches 1 if block ^9 ^3 ^-5 brr:flood_exit_button["brr:pressed"=true,"minecraft:cardinal_direction"="east"] run scoreboard players add code_match easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score left_code1 easy matches 1 unless score exit_door easy matches 1 if block ^9 ^3 ^-5 brr:flood_exit_button["brr:pressed"=true,"minecraft:cardinal_direction"="east"] run scoreboard players add left_code easy 1
# // Left Code 2
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score left_code2 easy matches 0 unless score exit_door easy matches 1 if block ^9 ^3 ^-4 brr:flood_exit_button["brr:pressed"=false,"minecraft:cardinal_direction"="east"] run scoreboard players add code_match easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score left_code2 easy matches 0 unless score exit_door easy matches 1 if block ^9 ^3 ^-4 brr:flood_exit_button["brr:pressed"=false,"minecraft:cardinal_direction"="east"] run scoreboard players add left_code easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score left_code2 easy matches 1 unless score exit_door easy matches 1 if block ^9 ^3 ^-4 brr:flood_exit_button["brr:pressed"=true,"minecraft:cardinal_direction"="east"] run scoreboard players add code_match easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score left_code2 easy matches 1 unless score exit_door easy matches 1 if block ^9 ^3 ^-4 brr:flood_exit_button["brr:pressed"=true,"minecraft:cardinal_direction"="east"] run scoreboard players add left_code easy 1
# // Left Code 3
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score left_code3 easy matches 0 unless score exit_door easy matches 1 if block ^9 ^3 ^-3 brr:flood_exit_button["brr:pressed"=false,"minecraft:cardinal_direction"="east"] run scoreboard players add code_match easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score left_code3 easy matches 0 unless score exit_door easy matches 1 if block ^9 ^3 ^-3 brr:flood_exit_button["brr:pressed"=false,"minecraft:cardinal_direction"="east"] run scoreboard players add left_code easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score left_code3 easy matches 1 unless score exit_door easy matches 1 if block ^9 ^3 ^-3 brr:flood_exit_button["brr:pressed"=true,"minecraft:cardinal_direction"="east"] run scoreboard players add code_match easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score left_code3 easy matches 1 unless score exit_door easy matches 1 if block ^9 ^3 ^-3 brr:flood_exit_button["brr:pressed"=true,"minecraft:cardinal_direction"="east"] run scoreboard players add left_code easy 1
# // Right Code 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score right_code1 easy matches 0 unless score exit_door easy matches 1 if block ^9 ^3 ^3 brr:flood_exit_button["brr:pressed"=false,"minecraft:cardinal_direction"="east"] run scoreboard players add code_match easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score right_code1 easy matches 0 unless score exit_door easy matches 1 if block ^9 ^3 ^3 brr:flood_exit_button["brr:pressed"=false,"minecraft:cardinal_direction"="east"] run scoreboard players add right_code easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score right_code1 easy matches 1 unless score exit_door easy matches 1 if block ^9 ^3 ^3 brr:flood_exit_button["brr:pressed"=true,"minecraft:cardinal_direction"="east"] run scoreboard players add code_match easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score right_code1 easy matches 1 unless score exit_door easy matches 1 if block ^9 ^3 ^3 brr:flood_exit_button["brr:pressed"=true,"minecraft:cardinal_direction"="east"] run scoreboard players add right_code easy 1
# // Right Code 2
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score right_code2 easy matches 0 unless score exit_door easy matches 1 if block ^9 ^3 ^4 brr:flood_exit_button["brr:pressed"=false,"minecraft:cardinal_direction"="east"] run scoreboard players add code_match easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score right_code2 easy matches 0 unless score exit_door easy matches 1 if block ^9 ^3 ^4 brr:flood_exit_button["brr:pressed"=false,"minecraft:cardinal_direction"="east"] run scoreboard players add right_code easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score right_code2 easy matches 1 unless score exit_door easy matches 1 if block ^9 ^3 ^4 brr:flood_exit_button["brr:pressed"=true,"minecraft:cardinal_direction"="east"] run scoreboard players add code_match easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score right_code2 easy matches 1 unless score exit_door easy matches 1 if block ^9 ^3 ^4 brr:flood_exit_button["brr:pressed"=true,"minecraft:cardinal_direction"="east"] run scoreboard players add right_code easy 1
# // Right Code 3
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score right_code3 easy matches 0 unless score exit_door easy matches 1 if block ^9 ^3 ^5 brr:flood_exit_button["brr:pressed"=false,"minecraft:cardinal_direction"="east"] run scoreboard players add code_match easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score right_code3 easy matches 0 unless score exit_door easy matches 1 if block ^9 ^3 ^5 brr:flood_exit_button["brr:pressed"=false,"minecraft:cardinal_direction"="east"] run scoreboard players add right_code easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score right_code3 easy matches 1 unless score exit_door easy matches 1 if block ^9 ^3 ^5 brr:flood_exit_button["brr:pressed"=true,"minecraft:cardinal_direction"="east"] run scoreboard players add code_match easy 1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score right_code3 easy matches 1 unless score exit_door easy matches 1 if block ^9 ^3 ^5 brr:flood_exit_button["brr:pressed"=true,"minecraft:cardinal_direction"="east"] run scoreboard players add right_code easy 1
# // Code's matching:
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score left_code easy matches 3 run setblock ^10 ^4 ^-4 verdant_froglight["pillar_axis"="z"]
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score left_code easy matches ..2 run setblock ^10 ^4 ^-4 black_concrete
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score right_code easy matches 3 run setblock ^10 ^4 ^4 verdant_froglight["pillar_axis"="z"]
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score right_code easy matches ..2 run setblock ^10 ^4 ^4 black_concrete
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score code_match easy matches 6 run scoreboard players set exit_door easy 1

# // = DOOR OPENING =
# // Scores
execute if score exit_door easy matches 1 run scoreboard players add door easy 1
# // Animation
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score door easy matches 1 run fill ^9 ^5 ^-1 ^9 ^5 ^1 verdant_froglight["pillar_axis"="z"]
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score door easy matches 1 run playsound sfx.alarm.lift @a[tag=easy] ^9 ^5 ^
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score door easy matches 20 run playsound sfx.alarm.lift @a[tag=easy] ^9 ^5 ^
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score door easy matches 40 run playsound sfx.alarm.lift @a[tag=easy] ^9 ^5 ^
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score door easy matches 30 run structure load "easy/exit_room:ExitDoor" ^10 ^2 ^-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score door easy matches 45 run structure load "easy/exit_room:ExitDoor" ^10 ^3 ^-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score door easy matches 60 run structure load "easy/exit_room:ExitDoor" ^10 ^4 ^-1
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score door easy matches 60.. run scoreboard players reset exit_door easy
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score door easy matches 60.. run scoreboard players reset door easy
# // - Flooding -
execute if score started4 easy matches 1 if score p_game easy matches 1.. if score r4_end easy matches 0 run scoreboard players add r4_timer_ms easy 1
execute if score r4_timer_ms easy matches 20.. run scoreboard players remove r4_timer_s easy 1
execute if score r4_timer_ms easy matches 20.. run scoreboard players set r4_timer_ms easy 0
execute if score r4_timer_s easy matches ..0 run scoreboard players add flood1 easy 1
# // text
execute if score r4_timer_s easy matches 1.. unless score r4_timer_s easy matches 31 run titleraw @a[tag=easy] actionbar {"rawtext":[{"text": "§2Tunnel Blast Doors §fmight fail in: §a§l"}, {"score": {"name": "r4_timer_s", "objective": "easy"}}, {"text": "§r§2 Seconds."}]}
execute as @s[type=brr:flood_room, name=easy_exit] at @s if score flood1 easy matches 1 if score r4_timer_s easy matches 0 run tellraw @a[tag=easy] {"rawtext":[{"text":"§3Blast door has failed! The water is now flooding the exit room."}]}
# // flood part
# // flood end
execute if score r4_timer_s easy matches ..0 run scoreboard players set r4_timer_s easy 4
execute if score flood1 easy matches 17 if score r4_timer_ms easy matches 10 run scoreboard players set r4_end easy 1
# // exit tunnel
execute as @s[type=brr:flood_room, name=easy_exit] at @s run tag @a[tag=easy, x=~21, y=~2, z=~-1, dx=2, dy=3, dz=2] add easytunnel4
execute as @s[type=brr:flood_room, name=easy_exit] at @s run tag @a[tag=easy, x=~20, y=~2, z=~-1, dx=0, dy=3, dz=2] remove easytunnel4
# // exit player count
scoreboard players set p_tunnel4 easy 0
execute as @a[tag=easytunnel4] at @s run scoreboard players add p_tunnel4 easy 1
# // evacuate players
execute if score p_tunnel4 easy = p_game easy run scoreboard players set r4_end easy 1
execute if score r4_end easy matches 1 run scoreboard players add r4_transition easy 1
execute if score r4_transition easy matches 1 as @s[type=brr:flood_room, name=easy_exit] at @s run playsound sfx.doors.opened @a[tag=easy] ~8 ~19.5 ~4.5 1 0.7
execute if score r4_transition easy matches 1 as @s[type=brr:flood_room, name=easy_exit] at @s run structure load "easy:EasyTunnelDoor2" ~8 ~19 ~4 270_degrees
execute if score r4_transition easy matches 10 as @s[type=brr:flood_room, name=easy_exit] at @s run structure load "easy:EasyTunnelDoor1" ~8 ~19 ~4 270_degrees
execute if score r4_transition easy matches 10 run scoreboard players set started4 easy 1
execute if score r4_transition easy matches 10.. run scoreboard players reset left_code easy
execute if score r4_transition easy matches 10.. run scoreboard players reset left_code1 easy
execute if score r4_transition easy matches 10.. run scoreboard players reset left_code2 easy
execute if score r4_transition easy matches 10.. run scoreboard players reset left_code3 easy
execute if score r4_transition easy matches 10.. run scoreboard players reset right_code easy
execute if score r4_transition easy matches 10.. run scoreboard players reset right_code1 easy
execute if score r4_transition easy matches 10.. run scoreboard players reset right_code2 easy
execute if score r4_transition easy matches 10.. run scoreboard players reset right_code3 easy
execute if score r4_transition easy matches 10.. run scoreboard players reset r4_timer_ms easy
execute if score r4_transition easy matches 10.. run scoreboard players reset r4_timer_s easy
execute if score r4_transition easy matches 10.. run scoreboard players reset r4_end easy
execute if score r4_transition easy matches 10.. run scoreboard players reset r4_transition easy