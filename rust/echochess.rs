#[derive(Debug, Clone)]
struct Puzzle {
    backing: Grid,
    pieces: Vec<P>,
    white: (P, Cell),
}

impl std::str::FromStr for Puzzle {
    type Err = &'static str;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let mut current_line = 0;
        let mut white = None;
        let mut v = vec![];
        let mut pieces = vec![];
        let mut current_width = 0;
        let mut width = 0;
        for (i, c) in s.chars().enumerate() {
            let enemy = match c {
                d if c.is_digit(10) => {
                    let count = d.to_digit(10).unwrap();
                    current_width += count;
                    for _ in 0..count {
                        v.push(Cell::Empty);
                    }
                    continue;
                }
                'x' | 'X' => Cell::Wall,
                'q' => Cell::Queen,
                'k' => Cell::King,
                'n' => Cell::Knight,
                'b' => Cell::Bishop,
                'r' => Cell::Rook,
                'p' => Cell::Pawn,
                'Q' | 'R' | 'K' | 'B' | 'N' | 'P' => {
                    if white.is_some() {
                        return Err("multiple white");
                    } else {
                        let kind = match c {
                            'Q' => Cell::Queen,
                            'K' => Cell::King,
                            'N' => Cell::Knight,
                            'B' => Cell::Bishop,
                            'R' => Cell::Rook,
                            'P' => Cell::Pawn,
                            _ => unreachable!(),
                        };
                        let location = P {
                            x: current_width as isize,
                            y: current_line as isize,
                        };
                        white = Some((location, kind));
                        v.push(Cell::Empty);
                        current_width += 1;
                        continue;
                    }
                }
                '/' => {
                    if current_line == 0 {
                        width = current_width;
                    } else if width != current_width {
                        dbg!(i, width, current_width);
                        return Err("Incorrectly sized line");
                    }
                    current_width = 0;
                    current_line += 1;
                    continue;
                }
                ' ' => {
                    if current_width != width {
                        return Err("fen ended prematurely");
                    } else if let Some(white) = white {
                        v.push(Cell::Wall);
                        let backing = Grid {
                            backing: v,
                            width: width as isize,
                            height: current_line + 1,
                        };
                        return Ok(Puzzle {
                            backing,
                            white,
                            pieces,
                        });
                    } else {
                        return Err("No white");
                    }
                }
                _ => return Err("Invalid character"),
            };
            if enemy != Cell::Wall {
                pieces.push(P {
                    x: current_width as isize,
                    y: current_line,
                });
            }
            current_width += 1;
            v.push(enemy);
        }
        Err("Unened fen")
    }
}

#[derive(Debug, Clone)]
struct Grid {
    backing: Vec<Cell>,
    width: isize,
    height: isize,
}

impl std::ops::Index<P> for Grid {
    type Output = Cell;

    fn index(&self, i: P) -> &Self::Output {
        if i.x < 0 || i.y < 0 || i.y >= self.height || i.x >= self.width {
            &Cell::Wall
        } else {
            &self.backing[(i.y * self.width + i.x) as usize]
        }
    }
}

impl std::ops::IndexMut<P> for Grid {
    fn index_mut(&mut self, i: P) -> &mut Self::Output {
        if i.x < 0 || i.y < 0 || i.y >= self.height || i.x >= self.width {
            &mut self.backing[(self.width * self.height) as usize]
        } else {
            &mut self.backing[(i.y * self.width + i.x) as usize]
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
struct P {
    x: isize,
    y: isize,
}

impl std::ops::Add<(isize, isize)> for P {
    type Output = Self;

    fn add(self, other: (isize, isize)) -> Self {
        Self {
            x: self.x + other.0,
            y: self.y + other.1,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
struct State {
    white: (P, Cell),
    alive: Vec<bool>,
    depth: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
enum Cell {
    Wall,
    Pawn,
    Queen,
    King,
    Bishop,
    Knight,
    Rook,
    Empty,
}

fn find_traversable(kind: Cell, grid: &mut Grid, temp: &mut Vec<P>, output: &mut HashSet<P>) {
    while let Some(mut next) = temp.pop() {
        use Cell::*;
        match &grid[next] {
            Wall => continue,
            Empty => grid[next] = Wall,
            _ => {
                output.insert(next);
                grid[next] = Wall;
                continue;
            }
        }
        let directions = match kind {
            Wall | Empty => unreachable!(),
            Queen | King => &[
                (-1, -1),
                (-1, 0),
                (-1, 1),
                (0, -1),
                (0, 1),
                (1, -1),
                (1, 0),
                (1, 1),
            ][..],
            Rook => &[(-1, 0), (0, -1), (0, 1), (1, 0)],
            Bishop => &[(-1, -1), (-1, 1), (1, -1), (1, 1)],
            Knight => &[
                (-2, -1),
                (-1, -2),
                (-2, 1),
                (1, -2),
                (2, -1),
                (-1, 2),
                (2, 1),
                (1, 2),
            ],
            Pawn => {
                next.y -= 1;
                temp.push(next);
                next.x -= 1;
                if grid[next] != Wall {
                    temp.push(next);
                }
                next.x += 2;
                if grid[next] != Wall {
                    temp.push(next);
                }
                continue;
            }
        };
        for d in directions {
            temp.push(next + *d)
        }
    }
}
use std::collections::{HashMap, HashSet, VecDeque};
fn solve(p: &Puzzle) -> Vec<P> {
    let mut graph = HashMap::new();
    let start = State {
        white: p.white,
        alive: vec![true; p.pieces.len()],
        depth: 0,
    };
    graph.insert(start.clone(), start.clone());
    let mut todo = VecDeque::from([start]);
    let mut temp_grid;
    let mut traverse_temp = Vec::new();
    let mut to_kill = HashSet::new();
    while let Some(next) = todo.pop_front() {
        temp_grid = p.backing.clone();
        for (l, alive) in p.pieces.iter().zip(next.alive.iter()) {
            if !alive {
                temp_grid[*l] = Cell::Empty;
            }
        }
        traverse_temp.clear();
        traverse_temp.push(next.white.0);
        to_kill.clear();
        find_traversable(
            next.white.1,
            &mut temp_grid,
            &mut traverse_temp,
            &mut to_kill,
        );
        for (i, l) in p.pieces.iter().enumerate() {
            if to_kill.contains(l) {
                let white = (*l, p.backing[*l]);
                let depth = next.depth + 1;
                let mut alive = next.alive.clone();
                alive[i] = false;
                if depth == alive.len() {
                    let mut next = next;
                    let mut out = vec![white.0];
                    while next.depth != 0 {
                        out.push(next.white.0);
                        next = graph
                            .get(&next)
                            .expect("graph always records parents")
                            .clone();
                    }
                    out.push(p.white.0);
                    out.reverse();
                    return out;
                }
                let child = State {
                    white,
                    depth,
                    alive,
                };
                if !graph.contains_key(&child) {
                    graph.insert(child.clone(), next.clone());
                    todo.push_back(child);
                }
            }
        }
    }
    vec![]
}

fn main() {
    let p: Puzzle = "xxxx1x/xrnbx1/pxpx1x/Nrb3/px1xrx/xp1nxx  w - - 0 1 1"
        .parse()
        .unwrap();
    dbg!(&p, solve(&p));
}
