data TopEntry = P Paren | E Entry deriving (Show)
data Entry = Tree Int [Entry] Int deriving (Show)
type Paren = (Bool, Int)

-- | Inserts a Paren into paired parens and outputs the resulting list of paired parens and the one extra paren
insertParen :: Entry -> Paren -> (Maybe Paren, [Entry], Maybe Paren)
insertParen (Tree left mid right) paren@(_, c)
  | right < c       = (Nothing, [Tree left mid right], Just paren)
  | c < left        = (Just paren, [Tree left mid right], Nothing)
  | otherwise       = combine (partition mid paren) paren left right

deleteParen :: Entry -> Paren -> (Maybe Paren, [Entry], Maybe Paren)
deleteParen (Tree left mid right) paren@(dir, c)
  | right < c || c < left       = error "Can't delete paren: not present"
  | left == c && dir == False   = (Nothing, mid, Just (True,right))
  | right == c && dir == True   = (Just (False,left), mid, Nothing)
  | otherwise                   = deleteHelper (partition mid paren) paren left right

deleteHelper :: ([Entry], Maybe Entry, [Entry]) -> Paren -> Int -> Int -> (Maybe Paren, [Entry], Maybe Paren)
deleteHelper (_, Nothing, _) _ _ _                               = error "Can't delete paren: not present"
deleteHelper (xs, Just e@(Tree l _ _), ys) (True,c) left right   = (Just (False,left), xs++[Tree l (list++ys) right], Nothing)
  where (_, list, _) = deleteParen e (True,c)
deleteHelper (xs, Just e@(Tree _ _ r), ys) (False,c) left right  = (Nothing, (Tree left (xs++list) r):ys, Just (True, right))
  where (_, list, _) = deleteParen e (False,c)

-- | Recombines lists of entries and a paren, inserting the paren deeper if necessary
combine :: ([Entry], Maybe Entry, [Entry]) -> Paren -> Int -> Int -> (Maybe Paren, [Entry], Maybe Paren)
combine (xs, Nothing, ys) (True,c) left right                = (Nothing, (Tree left xs c):ys,         Just (True, right))
combine (xs, Just e@(Tree _ _ r), ys) (True,c) left right    = (Nothing, (Tree left (xs++list) r):ys, Just (True, right))
  where (_, list, _) = insertParen e (True,c)
combine (xs, Nothing, ys) (False,c) left right               = (Just (False,left), xs++[Tree c ys right],         Nothing)
combine (xs, Just e@(Tree l _ _), ys) (False,c) left right   = (Just (False,left), xs++[Tree l (list++ys) right], Nothing)
  where (_, list, _) = insertParen e (False,c)

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
  where (_, list, _) = deleteParen e (True,c)
deleteTopHelper (xs, Just (E e@(Tree _ _ r)), ys) (False,c) = (xs++(map E list), Just (True,r), ys)
  where (_, list, _) = deleteParen e (False,c)


-- | Similar to combine, but prepares for linear probing instead of returning a list
combineTop :: ([TopEntry], Maybe TopEntry, [TopEntry]) -> Paren -> ([TopEntry],Paren,[TopEntry])
combineTop (xs, Nothing, ys) paren                     = (xs,paren,ys)
combineTop (_, Just (P _), _) _par                     = error "Can't insert a paren inside another paren"
combineTop (xs, Just (E e@(Tree _ _ r)), ys) (True,c)  = (xs++(map E list), (True,r), ys)
  where (_, list, _) = insertParen e (True,c)
combineTop (xs, Just (E e@(Tree l _ _)), ys) (False,c) = (xs, (False, l), (map E list)++ys)
  where (_, list, _) = insertParen e (False,c)

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
