# = SCORES =
execute if score start easy matches 1 run scoreboard players add lift easy 1
execute if score start easy matches 1 run scoreboard players add alarm easy 1
# only rewind during a real reset (game in progress), so a leftover reset score can't freeze the lift
execute if score reset easy matches 1 if score start easy matches 2 run scoreboard players remove lift easy 1

# = Lift states =
# The platform floor, cables and keeping players on the lift are handled by BP/scripts/lift.js
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches -10 run tp @s ~ ~0.75 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches -9 run tp @s ~ ~0.50 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches -8 run tp @s ~ ~0.30 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches -7 run tp @s ~ ~0.20 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches -6 run tp @s ~ ~0.15 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches -5 run tp @s ~ ~0.10 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches -4 run tp @s ~ ~0.07 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches -3 run tp @s ~ ~0.05 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches -2 run tp @s ~ ~0.02 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches -1 run tp @s ~ ~0.01 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches 0 run tp @s ~ ~ ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches 1 run tp @s ~ ~-0.01 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches 2 run tp @s ~ ~-0.02 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches 3 run tp @s ~ ~-0.05 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches 4 run tp @s ~ ~-0.07 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches 5 run tp @s ~ ~-0.10 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches 6 run tp @s ~ ~-0.15 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches 7 run tp @s ~ ~-0.20 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches 8 run tp @s ~ ~-0.30 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches 9 run tp @s ~ ~-0.50 ~
execute as @e[type=brr:mainelevator, name=easylift] at @s if score lift_speed easy matches 10 run tp @s ~ ~-0.75 ~
# = CORE EVENTS IN ORDER =
# // - sound effects -
execute if score lift easy matches 1 run playsound sfx.alarm.lift @a 8 91 52
execute if score lift easy matches 1 run gamemode a @a[tag=easylift]
# // silo door open
execute if score lift easy matches 350 run playsound silo_door.open @a 8 -34 52
execute if score lift easy matches 410 run stopsound @a silo_door.open
execute if score lift easy matches 410 run playsound silo_door.opened @a 8 -35 52
# // silo door close
execute if score lift easy matches 644 run playsound silo_door.open @a 8 -34 52
execute if score lift easy matches 704 run stopsound @a silo_door.open
execute if score lift easy matches 704 run playsound silo_door.opened @a 8 -35 52
# // - lift door -
# // shut the main door (as if it matters lol, they can jump over it)
execute if score lift easy matches 1 run structure load "easy:EasyLiftDoor2" 6 89 49
execute if score lift easy matches 15 run structure load "easy:EasyLiftDoor1" 6 89 49
# // open the door after the lift has risen again
execute if score lift easy matches 977 run structure load "easy:EasyLiftDoor2" 6 89 49
execute if score lift easy matches 992 run structure load "easy:EasyLiftDoor3" 6 89 49
# // lower the elevator
# soft drop when leaving the lift at the bottom (given once the lift has stopped, so nobody floats off it on the way down)
execute if score lift easy matches 520 run effect @a[tag=easy] slow_falling 6 1 true
execute if score lift easy matches 25 run scoreboard players set lift_speed easy 1
execute if score lift easy matches 25 run fill 6 88 50 10 90 54 air
execute if score lift easy matches 26 run summon brr:mainelevator 8 88 52 180 0 * easylift
execute if score lift easy matches 25 positioned 8 89 52 run playsound sfx.elevator.lift @a[r=20] ~ ~ ~
execute if score lift easy matches 25 run playsound sfx.elevator.move @a[tag=easylift]
execute if score lift easy matches 50 run scoreboard players set lift_speed easy 2
execute if score lift easy matches 60 run scoreboard players set lift_speed easy 3
execute if score lift easy matches 80 run scoreboard players set lift_speed easy 4
execute if score lift easy matches 100 run scoreboard players set lift_speed easy 5
execute if score lift easy matches 120 run scoreboard players set lift_speed easy 6
execute if score lift easy matches 150 run scoreboard players set lift_speed easy 7
execute if score lift easy matches 180 run scoreboard players set lift_speed easy 8
execute if score lift easy matches 220 run scoreboard players set lift_speed easy 9
execute if score lift easy matches 250 run scoreboard players set lift_speed easy 10
execute if score lift easy matches 320 run scoreboard players set lift_speed easy 9
execute if score lift easy matches 340 run scoreboard players set lift_speed easy 8
execute if score lift easy matches 375 run scoreboard players set lift_speed easy 7
execute if score lift easy matches 400 run scoreboard players set lift_speed easy 6
execute if score lift easy matches 440 run scoreboard players set lift_speed easy 5
execute if score lift easy matches 480 run scoreboard players set lift_speed easy 4
execute if score lift easy matches 490 run scoreboard players set lift_speed easy 3
execute if score lift easy matches 505 run scoreboard players set lift_speed easy 2
execute if score lift easy matches 515 run scoreboard players set lift_speed easy 1
execute if score lift easy matches 520 run scoreboard players set lift_speed easy 0
execute if score lift easy matches 550 run scoreboard players set lift_speed easy -1
execute if score lift easy matches 560 run scoreboard players set lift_speed easy -2
execute if score lift easy matches 580 run scoreboard players set lift_speed easy -3
execute if score lift easy matches 600 run scoreboard players set lift_speed easy -4
execute if score lift easy matches 620 run scoreboard players set lift_speed easy -5
execute if score lift easy matches 640 run scoreboard players set lift_speed easy -6
execute if score lift easy matches 660 run scoreboard players set lift_speed easy -7
execute if score lift easy matches 670 run scoreboard players set lift_speed easy -8
execute if score lift easy matches 680 run scoreboard players set lift_speed easy -9
execute if score lift easy matches 690 run scoreboard players set lift_speed easy -10
execute if score lift easy matches 800 run scoreboard players set lift_speed easy -9
execute if score lift easy matches 830 run scoreboard players set lift_speed easy -8
execute if score lift easy matches 860 run scoreboard players set lift_speed easy -7
execute if score lift easy matches 870 run scoreboard players set lift_speed easy -6
execute if score lift easy matches 885 run scoreboard players set lift_speed easy -5
execute if score lift easy matches 895 run scoreboard players set lift_speed easy -4
execute if score lift easy matches 915 run scoreboard players set lift_speed easy -3
execute if score lift easy matches 925 run scoreboard players set lift_speed easy -2
execute if score lift easy matches 935 run scoreboard players set lift_speed easy -1
execute if score lift easy matches 950 run scoreboard players set lift_speed easy 0
# back at the surface: line it up exactly with the shaft top and close the floor panels (1.25s),
# then despawn the entity quietly and put the block lift back in its place
execute if score lift easy matches 950 as @e[type=brr:mainelevator, name=easylift] at @s run tp @s ~ 88 ~
execute if score lift easy matches 950 run event entity @e[type=brr:mainelevator, name=easylift] brr:close
execute if score lift easy matches 976 run event entity @e[type=brr:mainelevator, name=easylift] brr:despawn
# // - entering the gamemode shaft
execute if score lift easy matches 263 run function game_functions/mode_easy/decider
# // Entering Room 1
execute if score lift easy matches 329 run kill @a[x=5.5, y=23, z=49.5, dx=5, dy=68, dz=5, tag=easy]
execute if score lift easy matches 329 run structure load "lobby:LiftBorderPrecaution" 5 -59 49
execute if score lift easy matches 520 run playsound sfx.elevator.stop @a[tag=easy]
execute if score lift easy matches 520 run stopsound @a[tag=easy] sfx.elevator.move
# // Release players
execute if score lift easy matches 530 run playsound sfx.doors.liftsepparate @a 8 -49 52
# floor panels swing open: the lift loses its floor and everyone drops into room 1. It stays open while it rises.
execute if score lift easy matches 530 run event entity @e[type=brr:mainelevator, name=easylift] brr:open
execute if score lift easy matches 540 run kill @a[x=5.5, y=-36, z=49.5, dx=5, dy=68, dz=5, tag=easy]
# // begin game
execute if score lift easy matches 540 run scoreboard players set started easy 1
# // Raise elevator back to the surface
execute if score lift easy matches 565 run structure load "lobby:LiftBorderRemove" 5 -59 49
# // Close the Elevator
execute if score lift easy matches 976 run structure load "lobby/elevators:MainElevator" 6 87 50
# = OTHER THINGS =
# // Silo door open
execute if score lift easy matches 350 run structure load "lobby/doors:SiloDoor2" 6 -36 47
execute if score lift easy matches 380 run structure load "lobby/doors:SiloDoor3" 6 -36 47
execute if score lift easy matches 410 run structure load "lobby/doors:SiloDoor4" 6 -36 47
# // Silo door close
execute if score lift easy matches 644 run structure load "lobby/doors:SiloDoor3" 6 -36 47
execute if score lift easy matches 674 run structure load "lobby/doors:SiloDoor2" 6 -36 47
execute if score lift easy matches 704 run structure load "lobby/doors:SiloDoor1" 6 -36 47
# = ALARM EFFECT =
execute if score alarm easy matches 1 run structure load "easy:EasyStateLower1" 5 93 49
execute if score alarm easy matches 4 run structure load "easy:EasyStateLower2" 5 93 49
execute if score alarm easy matches 7 run structure load "easy:EasyStateLower3" 5 93 49
execute if score alarm easy matches 10 run structure load "easy:EasyStateLower4" 5 93 49
execute if score alarm easy matches 13.. run scoreboard players set alarm easy 0
# // change elevator status
execute if score lift easy matches 992 run scoreboard players set start easy 2
execute if score lift easy matches 992 run structure load "easy:EasyStateBusy" 5 93 49
execute if score lift easy matches 992 if score p_game easy matches 0 run scoreboard players set reset easy 1
execute if score lift easy matches 992 run scoreboard players set lift easy 0
# = RESET =
execute if score reset easy matches 1 if score p_game easy matches 0 if score lift easy matches -40 if score start easy matches 2 run function game_functions/mode_easy/reset