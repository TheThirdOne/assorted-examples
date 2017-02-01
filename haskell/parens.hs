module parens where

data TopEntry = P Paren | E Entry deriving (Show)
data Entry = Tree Int [Entry] Int deriving (Show)
type Paren = (Bool, Int)

-- | Inserts a Paren into paired paren and outputs the resulting list of paired parens
insertParen :: Entry -> Paren -> [Entry]
insertParen (Tree left mid right) paren@(_, c)
  | right < c || c < left        = [Tree left mid right]
  | otherwise = combine (partition mid paren) paren left right

deleteParen :: Entry -> Paren -> [Entry]
deleteParen (Tree left mid right) paren@(dir, c)
  | right < c || c < left       = error "Can't delete paren: not present"
  | left == c && dir == False   = mid
  | right == c && dir == True   = mid
  | otherwise                   = deleteHelper (partition mid paren) paren left right

deleteHelper :: ([Entry], Maybe Entry, [Entry]) -> Paren -> Int -> Int -> [Entry]
deleteHelper (_, Nothing, _) _ _ _                           = error "Can't delete paren: not present"
deleteHelper (xs, Just e@(Tree l _ _), ys) (True,c) _ right  = xs++[Tree l (list++ys) right]
  where list = deleteParen e (True,c)
deleteHelper (xs, Just e@(Tree _ _ r), ys) (False,c) left _  = (Tree left (xs++list) r):ys
  where list = deleteParen e (False,c)

-- | Recombines lists of entries and a paren, inserting the paren deeper if necessary
combine :: ([Entry], Maybe Entry, [Entry]) -> Paren -> Int -> Int -> [Entry]
combine (xs, Nothing, ys) (True,c) left _               = (Tree left xs c):ys
combine (xs, Just e@(Tree _ _ r), ys) (True,c) left _   = (Tree left (xs++list) r):ys
  where list= insertParen e (True,c)
combine (xs, Nothing, ys) (False,c) _ right             = xs++[Tree c ys right]
combine (xs, Just e@(Tree l _ _), ys) (False,c) _ right = xs++[Tree l (list++ys) right]
  where list = insertParen e (False,c)

-- | Partitions a list of entries into the ones on the left of a paren, around a paren and to the right of a paren
partition :: [Entry] -> Paren -> ([Entry], Maybe Entry, [Entry])
partition (tree@(Tree left m right):xs) paren@(_, c)
  | c < left               = ([],Nothing,tree:xs)
  | right < c              = (tree:front,mid,back)
  | otherwise              = ([],Just tree,xs)
  where (front, mid, back) = partition xs paren

-- | Same as insertParen, but for a list of paired parens or parens
insertParenTop :: [TopEntry] -> Paren -> [TopEntry]
insertParenTop [] p = [P p]
insertParenTop xs paren = linearProbe $ combineTop (partitionTop xs paren) paren

deleteParenTop :: [TopEntry] -> Paren -> [TopEntry]
deleteParenTop [] _     = error "Can't delete paren from empty list"
deleteParenTop xs paren = simplifyMaybe $ deleteTopHelper (partitionTop xs paren) paren

simplifyMaybe :: ([TopEntry],Maybe Paren,[TopEntry]) -> [TopEntry]
simplifyMaybe (xs,Nothing,ys)    = xs++ys
simplifyMaybe (xs,Just paren,ys) = linearProbe (xs,paren,ys)

-- | Look for the closest match to an unpaired paren
linearProbe :: ([TopEntry],Paren,[TopEntry]) -> [TopEntry]
linearProbe (xs,paren@(True,c),ys) =  if (null back) || dir == True
                                      then xs ++ (P paren):ys
                                      else (reverse (tail back)) ++ (E (Tree i (map trimEntry $ reverse front) c)):ys
  where front = takeWhile isEntry $ reverse xs
        back  = dropWhile isEntry $ reverse xs
        P (dir,i) = head back
linearProbe (xs,paren@(False,c),ys) =  if (null back) || dir == False
                                then xs ++ (P paren):ys
                                else xs ++ (E (Tree c (map trimEntry front) i)):ys
  where front = takeWhile isEntry ys
        back  = dropWhile isEntry ys
        P (dir,i) = head back

isEntry :: TopEntry -> Bool
isEntry (E _) = True
isEntry _     = False

trimEntry :: TopEntry -> Entry
trimEntry (E e) = e
trimEntry _     = error "Can't trim a non Tree"

deleteTopHelper :: ([TopEntry], Maybe TopEntry, [TopEntry]) -> Paren -> ([TopEntry],Maybe Paren,[TopEntry])
deleteTopHelper (_, Nothing, _) _                           = error "Can't delete paren: not present"
deleteTopHelper (xs, Just (P paren@(dir,c)), ys) par@(d,i)  = if dir == d && c == i
                                                              then (xs,Nothing,ys)
                                                              else error "Can't delete paren; opposite paren in index"
deleteTopHelper (xs, Just (E e@(Tree l _ _)), ys) (True,c)  = (xs, Just (False,l),(map E list)++ys)
  where list = deleteParen e (True,c)
deleteTopHelper (xs, Just (E e@(Tree _ _ r)), ys) (False,c) = (xs++(map E list), Just (True,r), ys)
  where list = deleteParen e (False,c)


-- | Similar to combine, but prepares for linear probing instead of returning a list
combineTop :: ([TopEntry], Maybe TopEntry, [TopEntry]) -> Paren -> ([TopEntry],Paren,[TopEntry])
combineTop (xs, Nothing, ys) paren                     = (xs,paren,ys)
combineTop (_, Just (P _), _) _par                     = error "Can't insert a paren inside another paren"
combineTop (xs, Just (E e@(Tree _ _ r)), ys) (True,c)  = (xs++(map E list), (True,r), ys)
  where list = insertParen e (True,c)
combineTop (xs, Just (E e@(Tree l _ _)), ys) (False,c) = (xs, (False, l), (map E list)++ys)
  where list = insertParen e (False,c)

-- | Same as partition, but for impure lists
partitionTop :: [TopEntry] -> Paren -> ([TopEntry], Maybe TopEntry, [TopEntry])
partitionTop [] _ = ([], Nothing, [])
partitionTop ((E tree@(Tree left m right)):xs) paren@(_, c)
  | c < left      = ([],Nothing,(E tree):xs)
  | right < c     = ((E tree):front,mid,back)
  | otherwise     = ([],Just (E tree),xs)
  where (front, mid, back) = partitionTop xs paren
partitionTop ((P par@(_,a)):xs) paren@(_, b)
  | b < a     = ([],Nothing,(P par):xs)
  | a < b     = ((P par):front,mid,back)
  | otherwise = ([],Just (P par),xs)
    where (front, mid, back) = partitionTop xs paren

-- | Binds a useful form of fromString'
fromString = fromString' [] 0

fromString' :: [TopEntry] -> Int -> [Char] -> [TopEntry]
fromString' list i ('(':xs) = fromString' (insertParenTop list (False,i)) (i+1) xs
fromString' list i (')':xs) = fromString' (insertParenTop list (True,i))  (i+1) xs
fromString' list i (x:xs)   = fromString' list (i+1) xs
fromString' list _ []       = list

convert :: Int -> [Char]
convert i = ["\ESC[31m","\ESC[32m","\ESC[33m","\ESC[34m","\ESC[35m","\ESC[36m"] !! (i `mod` 6)

printColored :: [TopEntry] -> [Char] -> [Char]
printColored [] str                        = "\ESC[39m"++str
printColored _ []                          = ""
printColored ((P (False,_)):xs) ('(':str)  = "\ESC[39m(" ++ (printColored xs str)
printColored ((P (True,_)):xs)  (')':str)  = "\ESC[39m)" ++ (printColored xs str)
printColored ((E tree):xs) str             = out++printColored xs remStr
  where (remStr, out) = printColored' [tree] str 0
printColored xs (c:str) = c:(printColored xs str)

printColored' :: [Entry] -> [Char] -> Int -> ([Char],[Char])
printColored' [] str _                        = (str,"")
printColored' _ []   _                        = ("","")
printColored' ((Tree _ mid _):xs) ('(':str) i = (remStr, (convert i)++"(\ESC[39m"++elemOut++tillClose++(convert i)++")"++"\ESC[39m"++restOut)
  where (afterMid, elemOut) = printColored' mid str (i+1)
        tillClose           = takeWhile (/= ')') afterMid
        afterClose          = dropWhile (/= ')') afterMid
        (remStr,restOut)    = printColored' xs (tail afterClose) i
printColored' xs (c:str) i                    = (remStr, c:out)
  where (remStr, out)   = printColored' xs str i
