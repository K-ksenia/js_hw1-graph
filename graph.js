const myAmazingGraph = {
    n: (xs) => xs.length,
    m: (xs, n) => xs.reduce((store, item) => item + store, 0) / n,
    m2: (xs, n) => xs.reduce((store, item) => item * store, 1) / n,
    v: (m, m2) => m*m - m2,
    xs: () => [1, 2, 3]
};

const errorGraph = {
    n: (a) => a,
    b: (n) => n,
    z: (y) => y,
    x: (z) => z,
    y: (x) => x,
};

class Graph {
    runThroughGraph(vertex) {
		const results = {};
		const vertexStack = [vertex];
		const path = new Set([vertex]);

		while (vertexStack.length > 0) {
			const node = vertexStack.pop();

			// если результат функции уже найден, то не считаем ее
			if (results[node] !== undefined) continue;

			// проверяем есть ли вообще такая вершина в графе
			if (this.graph[node] === undefined) {
                vertexStack.push(node);
			    throw new Error("can't find value for vertex " + node + " in graph!\n" +
                    "(Vertex " + node + " was detected this way: " + Object.values(vertexStack).join(' -> ') + ")");
            }

            // в this.graph[node] хранится описание функции (то, что после :)
            // нужно извлечь аргументы функции (то, что в скобках)
			const childNodes = this.getArgs(this.graph[node]);

			// Проверяем не повстречали ли уже эти вершины на нашем пути
			if (childNodes.some(d => path.has(d))) {
                vertexStack.push(node);
				vertexStack.push(...childNodes);
				throw new Error("detected cyclic dependency! " + Object.values(vertexStack).join(' -> '));
			}

			// Смотрим есть ли дети с еще не определенными результатами;
			if (childNodes.filter(n => results[n] === undefined).length > 0) {
			    // Если есть, то добавляем их в наш стек и путь
				vertexStack.push(node);
				path.add(node);
				vertexStack.push(...childNodes);
			} else {
			    // А если нет, то значит это конечная вершина и мы можем рассчитать ее
                // Справочка: .map меняет значения массива по указанной нами функции
				results[node] = this.graph[node].apply(null, childNodes.map(n => results[n]));
				// Удаляем вершину, так как отходим назад
				path.delete(node);
			}
		}

		return results
	}

    getArgs(func) {
        if (typeof func !== 'function')
            throw new Error("all nodes in graph must be described as functions!");

        let args = func.toString()
            .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s))/mg,'')
            .match(/[^\(]*\(\s*([^\)]*)\)/m)[1];

        return args === "" ? [] : args.split(/,/);
    }
}

class lazyGraph extends Graph {
    receiveGraph(graph) {
        this.graph = graph;
        return this;
    }
    calcVertex(vertex) {
        try {
            return this.runThroughGraph(vertex)[vertex]
        }
        catch (err) {
            console.log('Error:', err.message);
        }
    }
}

class eagerGraph extends Graph {
    receiveGraph(graph) {
        this.graph = graph;
        this.values = {};
        for (let key in this.graph) try {
            // Объединяем текущий values и полученные результаты
            this.values = Object.assign(this.values, this.runThroughGraph(key));
        }
        catch (err) {
            console.log('Error while receiving eagerGraph:', err.message);
            break;
        }
        return this;
    }
    calcVertex(vertex) {
        return this.values[vertex]
    }
}

// Тесты
console.log((new lazyGraph).receiveGraph(myAmazingGraph).calcVertex('v'));
console.log((new eagerGraph).receiveGraph(myAmazingGraph).calcVertex('v'));
console.log((new lazyGraph).receiveGraph(errorGraph).calcVertex('n'));
console.log((new eagerGraph).receiveGraph(errorGraph).calcVertex('n'));
console.log((new lazyGraph).receiveGraph(errorGraph).calcVertex('x'));
console.log((new eagerGraph).receiveGraph(errorGraph).calcVertex('x'));
